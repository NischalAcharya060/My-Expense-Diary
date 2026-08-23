"use client";

import { useState } from "react";
import { Plus, Trash2, Edit2, X, GripVertical, ChevronUp, ChevronDown } from "lucide-react";
import { useCategories, useExpenses } from "@/lib/store";
import { useRequireAuth } from "@/lib/useRequireAuth";
import { useTapScrollTop } from "@/lib/useTapScrollTop";
import AuthPrompt from "@/components/AuthPrompt";
import ConfirmDialog from "@/components/ConfirmDialog";
import BackButton from "@/components/BackButton";
import PullToRefresh from "@/components/PullToRefresh";
import { useToast } from "@/components/Toast";
import { hapticFeedback } from "@/lib/utils";
import type { CategoryItem } from "@/types";

const CATEGORY_ICONS = [
  "🛒", "🍔", "🚌", "🛍️", "💆", "💊", "📚", "🎮", "🏠", "📱",
  "🎬", "☕", "✈️", "🏋️", "💇", "🐾", "👶", "🎁", "💻", "🚗",
  "⛽", "🏥", "🎓", "🎵", "🧴", "🧹", "📦", "🔧", "💡", "🌐",
  "💰", "📈", "🏷️", "📝", "🎯", "🎪", "🏖️", "📸", "🐕", "🌸",
  "🍳", "🧊", "🪴", "🧸", "💈", "🏋️‍♀️", "🧪", "🔑", "🛍", "🧾",
];

const QUICK_COLORS = [
  "#16A34A", "#EA580C", "#2563EB", "#D946EF", "#8B5CF6",
  "#DC2626", "#0891B2", "#F59E0B", "#64748B", "#E11D48",
  "#7C3AED", "#6B7280", "#059669", "#D97706", "#4F46E5",
  "#EC4899", "#14B8A6", "#F97316", "#84CC16", "#0EA5E9",
];

export default function CategoriesPage() {
  const { categories, loaded, refetch: refetchCategories, addCategory, updateCategory, deleteCategory, applyCategoryOrder } = useCategories();
  const { expenses, refetch: refetchExpenses, updateExpense } = useExpenses();
  const { requireAuth, showAuthPrompt, setShowAuthPrompt } = useRequireAuth();
  const { toast } = useToast();
  const tapTop = useTapScrollTop();

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<CategoryItem | null>(null);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("🏷️");
  const [color, setColor] = useState("#6B7280");
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CategoryItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [reassignTo, setReassignTo] = useState("");
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  if (!loaded) {
    return (
      <div className="notebook-paper min-h-screen p-8 pt-16 lg:pl-20">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-paper-dark rounded" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-paper-dark rounded" />
          ))}
        </div>
      </div>
    );
  }

  const resetForm = () => {
    setName("");
    setIcon("🏷️");
    setColor("#6B7280");
    setEditing(null);
  };

  const startEdit = (cat: CategoryItem) => {
    setEditing(cat);
    setName(cat.name);
    setIcon(cat.icon);
    setColor(cat.color);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    try {
      if (editing) {
        await updateCategory(editing.id, { name: name.trim(), icon, color });
        toast("Category updated");
      } else {
        await addCategory(name.trim(), icon, color);
        toast("Category added");
      }
      resetForm();
      setShowForm(false);
    } catch (err) {
      console.error("Failed to save category:", err);
      toast("Failed to save category", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      // Used category: move its expenses to the chosen replacement first.
      const used = expenses.filter((e) => e.category === deleteTarget.name);
      let moved = 0;
      for (const e of used) {
        await updateExpense(e.id, { category: reassignTo });
        moved++;
      }
      await deleteCategory(deleteTarget.id);
      toast(
        moved > 0
          ? `Moved ${moved} ${moved === 1 ? "expense" : "expenses"} to ${reassignTo}`
          : "Category deleted"
      );
    } catch (err) {
      console.error(err);
      toast("Failed to delete category", "error");
    }
    setDeleting(false);
    setDeleteTarget(null);
  };

  const requestDelete = (cat: CategoryItem) => {
    requireAuth(() => {
      if (cat.id.startsWith("default-")) {
        toast("Default categories can't be deleted", "error");
        return;
      }
      const usedCount = getExpenseCount(cat.name);
      if (usedCount > 0 && categories.filter((c) => c.id !== cat.id).length === 0) {
        toast(`Can't delete — ${usedCount} ${usedCount === 1 ? "expense uses" : "expenses use"} this category. Add another one first.`, "error");
        return;
      }
      setReassignTo(categories.find((c) => c.id !== cat.id)?.name ?? "");
      setDeleteTarget(cat);
    });
  };

  /* ---------- manual ordering ---------- */

  const moveCategory = (id: string, dir: -1 | 1) => {
    const ids = categories.map((c) => c.id);
    const from = ids.indexOf(id);
    const to = from + dir;
    if (from < 0 || to < 0 || to >= ids.length) return;
    [ids[from], ids[to]] = [ids[to], ids[from]];
    applyCategoryOrder(ids);
    hapticFeedback();
  };

  const dropCategory = (targetId: string) => {
    setDragOverId(null);
    if (!dragId || dragId === targetId) {
      setDragId(null);
      return;
    }
    const ids = categories.map((c) => c.id);
    const from = ids.indexOf(dragId);
    const to = ids.indexOf(targetId);
    if (from < 0 || to < 0) {
      setDragId(null);
      return;
    }
    ids.splice(from, 1);
    ids.splice(to, 0, dragId);
    applyCategoryOrder(ids);
    hapticFeedback();
    setDragId(null);
  };

  const getExpenseCount = (catName: string) =>
    expenses.filter((e) => e.category === catName).length;

  const getTotalSpent = (catName: string) =>
    expenses.filter((e) => e.category === catName).reduce((s, e) => s + e.amount, 0);

  return (
    <div className="notebook-paper min-h-screen page-enter">
      <PullToRefresh onRefresh={() => Promise.all([refetchCategories(), refetchExpenses()])} />
      <div className="max-w-3xl mx-auto px-4 sm:px-8 py-8 pt-16 lg:pl-20">
        <div
          {...tapTop}
          className="flex items-center justify-between mb-6 header-gradient cursor-pointer lg:cursor-default"
        >
          <div className="flex items-center gap-1">
            <BackButton />
            <div>
              <h1 className="font-handwritten text-4xl text-ink-dark">Categories</h1>
              <p className="text-xs text-ink-light mt-0.5">Organize your expenses with custom categories.</p>
            </div>
          </div>
          <button
            onClick={() => requireAuth(() => { resetForm(); setShowForm(true); })}
            className="flex items-center gap-1.5 px-4 py-2 bg-accent-warm text-white rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity shadow-sm"
          >
            <Plus size={16} /> Add Category
          </button>
        </div>

        {showForm && (
          <div className="paper-card p-5 mb-6 page-enter">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-handwritten text-xl text-ink-dark">
                {editing ? "Edit Category" : "New Category"}
              </h3>
              <button
                onClick={() => { resetForm(); setShowForm(false); }}
                className="p-1 hover:bg-paper-dark rounded transition-colors"
                aria-label="Close form"
              >
                <X size={16} className="text-ink-light" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-ink-light mb-1">Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Groceries"
                    className="w-full px-3 py-2 bg-paper-bg border border-[rgba(0,0,0,0.08)] rounded-md text-sm text-ink-dark focus:outline-none focus:border-accent-warm transition-colors"
                    autoFocus
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-ink-light mb-1">Preview</label>
                  <div
                    className="flex items-center gap-2 px-3 py-2 rounded-md border border-[rgba(0,0,0,0.08)]"
                    style={{ backgroundColor: color + "15", borderColor: color }}
                  >
                    <span className="text-xl">{icon}</span>
                    <span className="text-sm font-medium text-ink-dark">{name || "Category"}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs text-ink-light mb-1.5">Icon</label>
                <div className="rounded-lg bg-paper-dark/10 p-1">
                  <div className="grid grid-cols-7 sm:grid-cols-9 md:grid-cols-10 gap-1 max-h-40 overflow-y-auto p-1">
                    {CATEGORY_ICONS.map((emoji) => {
                      const isSelected = icon === emoji;

                      return (
                          <button
                              key={emoji}
                              type="button"
                              onClick={() => setIcon(emoji)}
                              title={emoji}
                              aria-label={`Select ${emoji}`}
                              aria-pressed={isSelected}
                              className={`
            relative aspect-square
            flex items-center justify-center
            rounded-lg
            text-lg
            transition-all duration-150
            focus:outline-none
            ${
                                  isSelected
                                      ? "bg-accent-warm/20 ring-1 ring-accent-warm/60 shadow-sm scale-105"
                                      : "bg-paper-bg/70 hover:bg-paper-bg hover:shadow-sm hover:scale-105"
                              }
          `}
                          >
          <span className="leading-none">
            {emoji}
          </span>

                            {isSelected && (
                                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-accent-warm text-[8px] text-white">
              ✓
            </span>
                            )}
                          </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs text-ink-light mb-1.5">Color</label>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {QUICK_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-7 h-7 rounded-full border-2 transition-all ${
                        color === c ? "border-ink-dark scale-125 shadow-md" : "border-transparent hover:scale-110"
                      }`}
                      style={{ backgroundColor: c }}
                      aria-label={`Select color ${c}`}
                    />
                  ))}
                  <label className="w-7 h-7 rounded-full border-2 border-dashed border-ink-light/40 flex items-center justify-center cursor-pointer hover:border-accent-warm transition-colors">
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="sr-only"
                    />
                    <span className="text-[10px] text-ink-light">+</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  disabled={saving || !name.trim()}
                  className="px-5 py-2 bg-accent-warm text-white rounded-md text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {saving ? "Saving..." : editing ? "Update" : "Add Category"}
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

        {categories.length === 0 ? (
          <div className="paper-card p-12 text-center">
            <span className="text-4xl block mb-2 font-handwritten">🏷️</span>
            <p className="font-handwritten text-2xl text-ink-light">No categories yet</p>
            <p className="text-xs text-ink-light mt-1">Create your first category to start organizing.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {categories.map((cat, idx) => {
              const count = getExpenseCount(cat.name);
              const total = getTotalSpent(cat.name);
              return (
                <div
                  key={cat.id}
                  draggable={dragId === cat.id}
                  onDragStart={(e) => {
                    setDragId(cat.id);
                    e.dataTransfer.effectAllowed = "move";
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = "move";
                    if (dragId !== cat.id) setDragOverId(cat.id);
                  }}
                  onDragLeave={() => setDragOverId((v) => (v === cat.id ? null : v))}
                  onDrop={(e) => {
                    e.preventDefault();
                    dropCategory(cat.id);
                  }}
                  onDragEnd={() => {
                    setDragId(null);
                    setDragOverId(null);
                  }}
                  className={`paper-card px-4 py-3 flex items-center gap-2 border-l-4 group hover:shadow-md transition-all ${
                    dragOverId === cat.id && dragId && dragId !== cat.id ? "ring-2 ring-accent-warm/50" : ""
                  } ${dragId === cat.id ? "opacity-40" : ""}`}
                  style={{ borderLeftColor: cat.color }}
                >
                  <span
                    onMouseDown={() => setDragId(cat.id)}
                    onTouchStart={() => setDragId(cat.id)}
                    title="Drag to reorder · or use the arrows"
                    aria-label={`Drag to reorder ${cat.name}`}
                    className="cursor-grab active:cursor-grabbing text-ink-light/70 hover:text-ink-dark transition-colors p-0.5 shrink-0 touch-none"
                  >
                    <GripVertical size={15} />
                  </span>
                  <span className="text-2xl shrink-0">{cat.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-ink-dark truncate">{cat.name}</p>
                    <p className="text-[10px] text-ink-light mt-0.5">
                      {count} expense{count !== 1 ? "s" : ""}
                      {total > 0 && <> · ₹{total.toLocaleString("en-IN", { minimumFractionDigits: 0 })}</>}
                    </p>
                  </div>
                  <div className="flex items-center gap-0.5 shrink-0 opacity-60 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => moveCategory(cat.id, -1)}
                      disabled={idx === 0}
                      className="p-1.5 hover:bg-paper-dark rounded text-ink-light hover:text-ink-dark transition-all disabled:opacity-20 disabled:hover:bg-transparent"
                      aria-label={`Move ${cat.name} up`}
                    >
                      <ChevronUp size={13} />
                    </button>
                    <button
                      onClick={() => moveCategory(cat.id, 1)}
                      disabled={idx === categories.length - 1}
                      className="p-1.5 hover:bg-paper-dark rounded text-ink-light hover:text-ink-dark transition-all disabled:opacity-20 disabled:hover:bg-transparent"
                      aria-label={`Move ${cat.name} down`}
                    >
                      <ChevronDown size={13} />
                    </button>
                    <button
                      onClick={() => requireAuth(() => startEdit(cat))}
                      className="p-1.5 hover:bg-paper-dark rounded text-ink-light hover:text-ink-dark transition-all"
                      aria-label="Edit"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      onClick={() => requestDelete(cat)}
                      className="p-1.5 hover:bg-paper-dark rounded text-ink-light hover:text-accent-red transition-all"
                      aria-label="Delete"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <AuthPrompt open={showAuthPrompt} onClose={() => setShowAuthPrompt(false)} feature="managing categories" />

      {/* Unused category — plain confirm */}
      {deleteTarget && getExpenseCount(deleteTarget.name) === 0 && (
        <ConfirmDialog
          open
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          loading={deleting}
          title="Delete category?"
          message={`This will remove "${deleteTarget.name}" from your categories. It isn't used by any expense.`}
        />
      )}

      {/* Used category — pick where its expenses should move */}
      {deleteTarget && getExpenseCount(deleteTarget.name) > 0 && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reassign-title"
          data-gesture-block
        >
          <div className="absolute inset-0 bg-black/40" onClick={() => !deleting && setDeleteTarget(null)} />
          <div className="relative bg-paper-bg rounded-lg shadow-xl w-full max-w-sm p-6 pt-8 paper-card text-center rotate-[-0.5deg]">
            <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-14 h-4 bg-amber-200/20 border border-amber-300/10 rotate-1 shadow-sm rounded-sm pointer-events-none" />
            <span className="text-5xl block mb-2" aria-hidden="true">📦</span>
            <h3 id="reassign-title" className="font-handwritten text-2xl text-ink-dark font-semibold mb-1.5">
              Move {getExpenseCount(deleteTarget.name)} {getExpenseCount(deleteTarget.name) === 1 ? "expense" : "expenses"} first
            </h3>
            <p className="text-xs text-ink-light leading-relaxed mb-4 max-w-[260px] mx-auto">
              &ldquo;{deleteTarget.name}&rdquo; is still in use. Choose where those expenses should go before deleting it.
            </p>
            <select
              value={reassignTo}
              onChange={(e) => setReassignTo(e.target.value)}
              className="w-full px-3 py-2.5 bg-paper-bg border border-[rgba(0,0,0,0.1)] rounded-lg text-sm text-ink-dark focus:outline-none focus:border-accent-warm mb-4"
              aria-label="Replacement category"
            >
              {categories
                .filter((c) => c.id !== deleteTarget.id)
                .map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.icon} {c.name}
                  </option>
                ))}
            </select>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="flex-1 py-2.5 border border-[rgba(0,0,0,0.1)] rounded-lg text-sm font-medium text-ink-medium hover:bg-paper-dark transition-colors disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting || !reassignTo}
                className="flex-1 py-2.5 bg-accent-red text-white rounded-lg text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50 shadow-sm cursor-pointer"
              >
                {deleting ? "Moving…" : "Move & Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
