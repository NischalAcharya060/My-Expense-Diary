"use client";

import { useSyncExternalStore, useState } from "react";
import { format, addMonths, subMonths } from "date-fns";
import { ChevronLeft, ChevronRight, FileSpreadsheet, FileText } from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useExpenses, useBudgets, useCategories, useIncome } from "@/lib/store";
import { formatCurrency } from "@/lib/utils";
import AuthGuard from "@/components/AuthGuard";
import { useToast } from "@/components/Toast";

export default function MonthlySummaryPage() {
  const { expenses, loaded } = useExpenses();
  const { getBudget } = useBudgets();
  const { getCategoryByName } = useCategories();
  const { getMonthIncome } = useIncome();
  const { toast } = useToast();
  const [currentDate, setCurrentDate] = useState(new Date());
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  if (!mounted || !loaded) {
    return (
      <div className="notebook-paper min-h-screen p-8 pt-16 lg:pl-20">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-paper-dark rounded" />
          <div className="h-32 bg-paper-dark rounded mt-4" />
        </div>
      </div>
    );
  }

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;
  const monthExpenses = expenses.filter((e) => e.date.startsWith(format(currentDate, "yyyy-MM")));
  const totalSpending = monthExpenses.reduce((s, e) => s + e.amount, 0);
  const bills = monthExpenses.filter((e) => e.expense_type === "Bill");
  const totalBills = bills.reduce((s, e) => s + e.amount, 0);

  const daysInMonth = new Date(year, month, 0).getDate();
  const daysWithData = new Set(monthExpenses.map((e) => e.date)).size;
  const avgDaily = daysWithData > 0 ? totalSpending / daysInMonth : 0;

  const dayTotals: Record<string, number> = {};
  monthExpenses.forEach((e) => {
    dayTotals[e.date] = (dayTotals[e.date] || 0) + e.amount;
  });
  const highestDay = Object.entries(dayTotals).sort((a, b) => b[1] - a[1])[0];

  const catTotals: Record<string, number> = {};
  monthExpenses.forEach((e) => {
    catTotals[e.category] = (catTotals[e.category] || 0) + e.amount;
  });
  const highestCategory = Object.entries(catTotals).sort((a, b) => b[1] - a[1])[0];

  const budget = getBudget(year, month);
  const budgetAmount = budget?.amount || 0;
  const remaining = budgetAmount - totalSpending;

  const monthIncome = getMonthIncome(year, month);
  const netBalance = monthIncome - totalSpending;

  function handleExportCSV() {
    const headers = ["Date", "Name", "Amount", "Category", "Payment Method", "Expense Type", "Note"];
    const rows = monthExpenses.map((e) => [
      e.date,
      `"${e.name.replace(/"/g, '""')}"`,
      e.amount.toFixed(2),
      e.category,
      e.payment_method,
      e.expense_type,
      `"${(e.note || "").replace(/"/g, '""')}"`,
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `expenses-${prefix}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast("CSV exported");
  }

  function handleExportExcel() {
    const data = monthExpenses.map((e) => ({
      Date: e.date,
      Name: e.name,
      Amount: e.amount,
      Category: e.category,
      "Payment Method": e.payment_method,
      "Expense Type": e.expense_type,
      Note: e.note || "",
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    ws["!cols"] = [
      { wch: 12 }, { wch: 30 }, { wch: 12 }, { wch: 15 },
      { wch: 15 }, { wch: 18 }, { wch: 30 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Expenses");
    XLSX.writeFile(wb, `expenses-${prefix}.xlsx`);
    toast("Excel exported");
  }

  function handleExportPDF() {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(`Expense Report — ${format(currentDate, "MMMM yyyy")}`, 14, 22);
    doc.setFontSize(10);
    doc.setTextColor(120);
    doc.text(`Generated on ${new Date().toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}`, 14, 30);
    doc.text(`Total entries: ${monthExpenses.length}  |  Total: ${formatCurrency(totalSpending)}`, 14, 36);

    autoTable(doc, {
      startY: 44,
      head: [["Date", "Name", "Amount", "Category", "Payment", "Type", "Note"]],
      body: monthExpenses.map((e) => [
        e.date,
        e.name,
        formatCurrency(e.amount),
        e.category,
        e.payment_method,
        e.expense_type,
        e.note || "",
      ]),
      styles: { fontSize: 7, cellPadding: 2 },
      headStyles: { fillColor: [212, 133, 74] },
      alternateRowStyles: { fillColor: [245, 240, 235] },
    });

    doc.save(`expenses-${prefix}.pdf`);
    toast("PDF exported");
  }

  return (
    <AuthGuard feature="monthly summaries">
    <div className="notebook-paper min-h-screen page-enter">
      <div className="max-w-3xl mx-auto px-4 sm:px-8 py-8 pt-16 lg:pl-20">
        <div className="flex items-center justify-between mb-6 header-gradient">
          <h1 className="font-handwritten text-3xl sm:text-4xl text-ink-dark">Monthly Summary</h1>
          {monthExpenses.length > 0 && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-paper-dark rounded text-[11px] text-ink-medium hover:bg-accent-green hover:text-white transition-colors border border-[rgba(0,0,0,0.06)] cursor-pointer"
                title="Export CSV"
              >
                <FileSpreadsheet size={13} /> CSV
              </button>
              <button
                onClick={handleExportExcel}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-paper-dark rounded text-[11px] text-ink-medium hover:bg-[#1A73E8] hover:text-white transition-colors border border-[rgba(0,0,0,0.06)] cursor-pointer"
                title="Export Excel"
              >
                <FileSpreadsheet size={13} /> Excel
              </button>
              <button
                onClick={handleExportPDF}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-paper-dark rounded text-[11px] text-ink-medium hover:bg-[#E84040] hover:text-white transition-colors border border-[rgba(0,0,0,0.06)] cursor-pointer"
                title="Export PDF"
              >
                <FileText size={13} /> PDF
              </button>
            </div>
          )}
        </div>

        {/* Month nav */}
        <div className="paper-card p-4 mb-6">
          <div className="flex items-center justify-between">
            <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="p-2 hover:bg-paper-dark rounded transition-colors" aria-label="Previous month">
              <ChevronLeft size={18} className="text-ink-dark" />
            </button>
            <h2 className="font-handwritten text-2xl text-ink-dark">{format(currentDate, "MMMM yyyy")}</h2>
            <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="p-2 hover:bg-paper-dark rounded transition-colors" aria-label="Next month">
              <ChevronRight size={18} className="text-ink-dark" />
            </button>
          </div>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <SummaryCard label="Income" value={formatCurrency(monthIncome)} />
          <SummaryCard label="Total Spending" value={formatCurrency(totalSpending)} />
          <SummaryCard label="Net Balance" value={formatCurrency(netBalance)} highlight={netBalance >= 0} />
          <SummaryCard label="Bills" value={formatCurrency(totalBills)} />
        </div>

        {/* Income vs Expense bar */}
        {(monthIncome > 0 || totalSpending > 0) && (
          <div className="paper-card p-4 mb-6">
            <p className="text-xs text-ink-light uppercase tracking-wide mb-3">Income vs Expenses</p>
            <div className="flex items-center gap-4 mb-2">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-accent-green font-semibold uppercase">Income</span>
                  <span className="text-xs text-accent-green font-semibold amount">{formatCurrency(monthIncome)}</span>
                </div>
                <div className="w-full h-3 bg-paper-dark rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-accent-green transition-all" style={{ width: `${monthIncome > 0 ? Math.min((monthIncome / Math.max(monthIncome, totalSpending)) * 100, 100) : 0}%` }} />
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-accent-red font-semibold uppercase">Expenses</span>
                  <span className="text-xs text-accent-red font-semibold amount">{formatCurrency(totalSpending)}</span>
                </div>
                <div className="w-full h-3 bg-paper-dark rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-accent-red transition-all" style={{ width: `${totalSpending > 0 ? Math.min((totalSpending / Math.max(monthIncome, totalSpending)) * 100, 100) : 0}%` }} />
                </div>
              </div>
            </div>
            <div className={`text-center mt-3 pt-3 border-t border-[rgba(0,0,0,0.06)]`}>
              <span className="text-[10px] text-ink-light uppercase tracking-wide">Net: </span>
              <span className={`text-sm font-semibold amount ${netBalance >= 0 ? "text-accent-green" : "text-accent-red"}`}>
                {netBalance >= 0 ? "+" : ""}{formatCurrency(netBalance)}
              </span>
            </div>
          </div>
        )}

        {budgetAmount > 0 && (
          <div className="paper-card p-4 mb-6">
            <p className="text-xs text-ink-light uppercase tracking-wide mb-2">Budget Progress</p>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-sm text-ink-dark">Spent: {formatCurrency(totalSpending)}</span>
              <span className="dots" />
              <span className="text-sm text-ink-medium">Budget: {formatCurrency(budgetAmount)}</span>
            </div>
            <div className="w-full h-2 bg-paper-dark rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${remaining < 0 ? "bg-accent-red" : "bg-accent-green"}`}
                style={{ width: `${Math.min((totalSpending / budgetAmount) * 100, 100)}%` }}
              />
            </div>
            <p className={`text-xs mt-1 ${remaining < 0 ? "text-accent-red" : "text-accent-green"}`}>
              {remaining < 0 ? `${formatCurrency(Math.abs(remaining))} over budget` : `${formatCurrency(remaining)} remaining`}
            </p>
          </div>
        )}

        {/* Additional stats */}
        <div className="paper-card p-6 mb-6">
          <h3 className="font-handwritten text-xl text-ink-dark mb-4">Details</h3>
          <div className="space-y-3">
            <StatRow label="Average Daily Spending" value={formatCurrency(avgDaily)} />
            {highestDay && (
              <StatRow label="Highest Spending Day" value={`${format(new Date(highestDay[0] + "T00:00:00"), "MMM d")} — ${formatCurrency(highestDay[1])}`} />
            )}
            {highestCategory && (
              <StatRow label="Highest Category" value={`${highestCategory[0]} — ${formatCurrency(highestCategory[1])}`} />
            )}
            <StatRow label="Total Entries" value={`${monthExpenses.length}`} />
          </div>
        </div>

        {/* Category breakdown */}
        <div className="paper-card p-6">
          <h3 className="font-handwritten text-xl text-ink-dark mb-4">By Category</h3>
          {Object.keys(catTotals).length === 0 ? (
            <p className="text-ink-light text-sm text-center py-4">No data for this month</p>
          ) : (
            <div className="space-y-2">
              {Object.entries(catTotals)
                .sort((a, b) => b[1] - a[1])
                .map(([cat, total]) => (
                    <div key={cat} className="flex items-center">
                      <span className="text-sm mr-3 shrink-0">{getCategoryByName(cat)?.icon || "🏷️"}</span>
                    <span className="text-sm text-ink-dark w-28">{cat}</span>
                    <div className="flex-1 mx-3">
                      <div className="w-full h-1.5 bg-paper-dark rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${(total / totalSpending) * 100}%`,
                            backgroundColor: getCategoryByName(cat)?.color || "#6B7280",
                          }}
                        />
                      </div>
                    </div>
                    <span className="text-sm text-ink-medium amount">{formatCurrency(total)}</span>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
    </AuthGuard>
  );
}

function SummaryCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="paper-card px-3 py-3 text-center">
      <p className="text-xs text-ink-light uppercase tracking-wide mb-1">{label}</p>
      <p className={`font-handwritten text-xl amount ${highlight === true ? "text-accent-green" : highlight === false ? "text-accent-red" : "text-ink-dark"}`}>{value}</p>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center py-1.5 border-b border-[rgba(0,0,0,0.04)] last:border-0">
      <span className="text-sm text-ink-medium">{label}</span>
      <span className="dots" />
      <span className="text-sm text-ink-dark amount">{value}</span>
    </div>
  );
}
