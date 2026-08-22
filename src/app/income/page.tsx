"use client";

import { useState, useSyncExternalStore } from "react";
import { format } from "date-fns";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import { useIncome } from "@/lib/store";
import { formatCurrency } from "@/lib/utils";
import { useRequireAuth } from "@/lib/useRequireAuth";
import AuthPrompt from "@/components/AuthPrompt";
import ConfirmDialog from "@/components/ConfirmDialog";
import BackButton from "@/components/BackButton";
import { useToast } from "@/components/Toast";

const INCOME_SOURCES = ["Salary", "Freelance", "Business", "Investment", "Gift", "Other"] as const;
const INCOME_CATEGORIES = ["Primary", "Side Hustle", "Investment", "Passive", "One-time", "Other"] as const;

export default function IncomePage() {
  const { income, loaded, addIncome, updateIncome, deleteIncome } = useIncome();
  const { requireAuth, showAuthPrompt, setShowAuthPrompt } = useRequireAuth();
  const { toast } = useToast();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [source, setSource] = useState("Salary");
  const [category, setCategory] = useState("Primary");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  if (!mounted || !loaded) {
    return (
      <div className="notebook-paper min-h-screen p-8 pt-16 lg:pl-20">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-paper-dark rounded" />
          <div className="h-4 w-32 bg-paper-dark rounded" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-paper-dark rounded" />
          ))}
        </div>
      </div>
    );
  }

  const filtered = income.filter((i) => {
    const matchSearch = !search || i.name.toLowerCase().includes(search.toLowerCase()) || i.source.toLowerCase().includes(search.toLowerCase());
    const matchCategory = filterCategory === "All" || i.category === filterCategory;
    return matchSearch && matchCategory;
  });

  const grouped = filtered.reduce<Record<string, typeof income>>((acc, item) => {
    (acc[item.date] ||= []).push(item);
    return acc;
  }, {});

  const totalIncome = filtered.reduce((s, i) => s + i.amount, 0);

  function resetForm() {
    setName(""); setAmount(""); setDate(format(new Date(), "yyyy-MM-dd"));
    setSource("Salary"); setCategory("Primary"); setNote("");
    setEditing(null);
  }

  function startEdit(id: string) {
    const item = income.find((i) => i.id === id);
    if (!item) return;
    setEditing(id);
    setName(item.name);
    setAmount(item.amount.toString());
    setDate(item.date);
    setSource(item.source);
    setCategory(item.category);
    setNote(item.note || "");
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !amount || parseFloat(amount) <= 0) return;
    setSaving(true);
    try {
      const data = {
        name: name.trim(),
        amount: parseFloat(amount),
        date,
        source,
        category,
        note: note.trim() || undefined,
      };
      if (editing) {
        await updateIncome(editing, data);
        toast("Income updated");
      } else {
        await addIncome(data);
        toast("Income logged");
      }
      resetForm();
      setShowForm(false);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to save income", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteIncome(id);
      toast("Income deleted");
      setDeleteTarget(null);
    } catch {
      toast("Failed to delete income", "error");
    }
  }

  return (
    <div className="notebook-paper min-h-screen page-enter">
      <div className="max-w-3xl mx-auto px-4 sm:px-8 py-8 pt-16 lg:pl-20">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 border-b border-[rgba(0,0,0,0.06)] pb-4 header-gradient">
          <div className="flex items-center gap-1">
            <BackButton />
            <div>
              <h1 className="font-handwritten text-4xl text-ink-dark">Income</h1>
              <p className="text-xs text-ink-light mt-0.5">Track your earnings and income sources.</p>
            </div>
          </div>
          <button
            onClick={() => requireAuth(() => { resetForm(); setShowForm(true); })}
            className="flex items-center gap-1.5 px-4 py-2 bg-accent-green text-white rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity shadow-sm cursor-pointer"
          >
            <Plus size={16} /> Add Income
          </button>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6 bg-paper-dark/30 p-3 rounded-lg border border-[rgba(0,0,0,0.04)]">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-light" />
            <input
              type="text"
              placeholder="Search by name or source..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-paper-bg border border-[rgba(0,0,0,0.08)] rounded-md text-sm text-ink-dark placeholder:text-ink-light/40 focus:outline-none focus:border-accent-warm transition-colors"
            />
          </div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 bg-paper-bg border border-[rgba(0,0,0,0.08)] rounded-md text-sm text-ink-dark focus:outline-none focus:border-accent-warm transition-colors cursor-pointer"
          >
            <option value="All">All Categories</option>
            {INCOME_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Total */}
        <div className="paper-card p-4 mb-6 bg-accent-green/5 border-l-4 border-l-accent-green">
          <p className="text-[10px] text-ink-light uppercase tracking-wider font-bold">Total Income</p>
          <p className="font-handwritten text-2xl text-accent-green amount font-semibold">{formatCurrency(totalIncome)}</p>
        </div>

        {/* Add/Edit Form */}
        {showForm && (
          <div className="paper-card p-6 mb-6 page-enter">
            <div className="flex items-center justify-between mb-4 border-b border-[rgba(0,0,0,0.06)] pb-2">
              <h3 className="font-handwritten text-xl text-ink-dark">{editing ? "Edit Income" : "Add Income"}</h3>
              <button
                onClick={() => { resetForm(); setShowForm(false); }}
                className="p-1 hover:bg-paper-dark rounded text-ink-light hover:text-ink-dark cursor-pointer"
                aria-label="Close form"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-ink-light mb-1">Name *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Monthly Salary"
                    className="w-full px-3 py-2 bg-paper-bg border border-[rgba(0,0,0,0.08)] rounded-md text-sm text-ink-dark placeholder:text-ink-light/40 focus:outline-none focus:border-accent-warm transition-colors"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-ink-light mb-1">Amount *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 bg-paper-bg border border-[rgba(0,0,0,0.08)] rounded-md text-sm text-ink-dark placeholder:text-ink-light/40 focus:outline-none focus:border-accent-warm transition-colors"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-ink-light mb-1">Date *</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 bg-paper-bg border border-[rgba(0,0,0,0.08)] rounded-md text-sm text-ink-dark focus:outline-none focus:border-accent-warm transition-colors"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-ink-light mb-1">Source *</label>
                  <select
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    className="w-full px-3 py-2 bg-paper-bg border border-[rgba(0,0,0,0.08)] rounded-md text-sm text-ink-dark focus:outline-none focus:border-accent-warm transition-colors cursor-pointer"
                  >
                    {INCOME_SOURCES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-ink-light mb-1">Category *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-paper-bg border border-[rgba(0,0,0,0.08)] rounded-md text-sm text-ink-dark focus:outline-none focus:border-accent-warm transition-colors cursor-pointer"
                  >
                    {INCOME_CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs text-ink-light mb-1">Note</label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Optional note..."
                  className="w-full px-3 py-2 bg-paper-bg border border-[rgba(0,0,0,0.08)] rounded-md text-sm text-ink-dark placeholder:text-ink-light/40 focus:outline-none focus:border-accent-warm transition-colors"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={saving || !name.trim() || !amount || parseFloat(amount) <= 0}
                  className="px-5 py-2 bg-accent-green text-white rounded-md text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {saving ? "Saving..." : editing ? "Update" : "Add Income"}
                </button>
                <button
                  type="button"
                  onClick={() => { resetForm(); setShowForm(false); }}
                  className="px-4 py-2 border border-[rgba(0,0,0,0.1)] rounded-md text-sm text-ink-medium hover:bg-paper-dark transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Income List */}
        {Object.keys(grouped).length === 0 ? (
          <div className="paper-card p-12 text-center relative overflow-hidden">
            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-20 h-4 bg-amber-200/30 border border-amber-300/20 rotate-[-2deg] rounded-sm pointer-events-none" />
            <span className="text-6xl block mb-3">💰</span>
            <p className="font-handwritten text-3xl text-ink-dark font-semibold">No income entries yet</p>
            <p className="text-xs text-ink-light mt-2 max-w-xs mx-auto leading-relaxed">
              Track your first income to see your true monthly balance.
            </p>
            <button
              onClick={() => requireAuth(() => setShowForm(true))}
              className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 bg-accent-green text-white rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity shadow-sm cursor-pointer"
            >
              ＋ Track Your First Income
            </button>
          </div>
        ) : (
          Object.entries(grouped).map(([date, dayItems]) => {
            const dayTotal = dayItems.reduce((s, i) => s + i.amount, 0);
            return (
              <div key={date} className="mb-6">
                <div className="flex items-center gap-3 mb-2 px-1">
                  <h3 className="font-handwritten text-xl text-ink-dark font-semibold">
                    {format(new Date(date + "T00:00:00"), "EEEE, MMMM d")}
                  </h3>
                  <span className="dots" />
                  <span className="text-xs text-accent-green font-semibold amount">{formatCurrency(dayTotal)}</span>
                </div>
                <div className="space-y-2">
                  {dayItems.map((item) => (
                    <div
                      key={item.id}
                      className="paper-card px-4 py-3 flex items-center justify-between group hover:shadow-md transition-all"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-ink-dark truncate">{item.name}</p>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent-green/10 text-accent-green font-medium">{item.source}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-paper-dark text-ink-light font-medium">{item.category}</span>
                        </div>
                        {item.note && <p className="text-[10px] text-ink-light mt-0.5 truncate">{item.note}</p>}
                      </div>
                      <div className="flex items-center gap-3 shrink-0 ml-3">
                        <span className="text-sm font-semibold text-accent-green amount">{formatCurrency(item.amount)}</span>
                        <div className="flex items-center gap-0.5 opacity-60 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => requireAuth(() => startEdit(item.id))}
                            className="p-1 hover:bg-paper-dark rounded text-ink-light hover:text-ink-dark transition-colors cursor-pointer"
                            aria-label="Edit income"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(item.id)}
                            className="p-1 hover:bg-paper-dark rounded text-ink-light hover:text-accent-red transition-colors cursor-pointer"
                            aria-label="Delete income"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>

      {showAuthPrompt && <AuthPrompt open={showAuthPrompt} onClose={() => setShowAuthPrompt(false)} />}

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && handleDelete(deleteTarget)}
        title="Delete Income?"
        message="This will permanently remove this income entry."
        confirmLabel="Delete"
      />
    </div>
  );
}
