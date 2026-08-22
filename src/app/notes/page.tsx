"use client";

import { useSyncExternalStore, useState, useRef, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Pin, PinOff, X, Check, ArrowDownUp, ChevronDown, LayoutGrid, Columns3, Link2, ReceiptText } from "lucide-react";
import { useNotes, useExpenses, useCategories } from "@/lib/store";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import type { Note } from "@/types";
import { useRequireAuth } from "@/lib/useRequireAuth";
import AuthPrompt from "@/components/AuthPrompt";
import ConfirmDialog from "@/components/ConfirmDialog";
import BackButton from "@/components/BackButton";
import { useToast } from "@/components/Toast";

const NOTE_COLORS = [
  { name: "Yellow", value: "#FEF9C3" },
  { name: "Green", value: "#DCFCE7" },
  { name: "Blue", value: "#DBEAFE" },
  { name: "Pink", value: "#FCE7F3" },
  { name: "Purple", value: "#F3E8FF" },
  { name: "Orange", value: "#FFEDD5" },
];

const TILTS = [
  "rotate-[-1deg]",
  "rotate-[1.5deg]",
  "rotate-[-1.5deg]",
  "rotate-[0.5deg]",
  "rotate-[-0.5deg]",
  "rotate-[1deg]"
];

type NoteSortMode = "edited" | "created" | "color";
type NoteLayout = "grid" | "masonry";

const NOTE_SORT_MODES: readonly NoteSortMode[] = ["edited", "created", "color"];
const NOTE_LAYOUTS: readonly NoteLayout[] = ["grid", "masonry"];

const SORT_LABELS: Record<NoteSortMode, string> = {
  edited: "Last edited",
  created: "Created date",
  color: "Color",
};

function loadPref<T extends string>(key: string, allowed: readonly T[], fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return allowed.includes(raw as T) ? (raw as T) : fallback;
  } catch {
    return fallback;
  }
}

function savePref(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    return;
  }
}

function countWords(text: string): number {
  const t = text.trim();
  return t ? t.split(/\s+/).length : 0;
}

function isNoteColor(value: string): boolean {
  return NOTE_COLORS.some((c) => c.value === value);
}

function AutoResizeTextarea({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const ref = useRef<HTMLTextAreaElement | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);
  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Write your thoughts here..."
      rows={5}
      className="w-full bg-transparent border-none text-[#2C2C2C] text-sm placeholder:text-black/30 focus:outline-none resize-none overflow-hidden font-medium leading-relaxed"
    />
  );
}

export default function NotesPage() {
  return <NotesContent />;
}

function NotesContent() {
  const { notes, loaded, addNote, updateNote, deleteNote } = useNotes();
  const { expenses } = useExpenses();
  const { getCategoryByName } = useCategories();
  const router = useRouter();
  const [showEditor, setShowEditor] = useState(false);
  const [editing, setEditing] = useState<Note | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [color, setColor] = useState("#FEF9C3");
  const [linkedExpenseId, setLinkedExpenseId] = useState<string | null>(null);
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<NoteSortMode>(() => loadPref("notes_sort_v1", NOTE_SORT_MODES, "edited"));
  const [layout, setLayout] = useState<NoteLayout>(() => loadPref("notes_layout_v1", NOTE_LAYOUTS, "grid"));
  const [dragColor, setDragColor] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const { requireAuth, showAuthPrompt, setShowAuthPrompt } = useRequireAuth();
  const { toast } = useToast();

  const sorted = useMemo(() => {
    return [...notes].sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      switch (sortMode) {
        case "created":
          return b.created_at.localeCompare(a.created_at);
        case "color": {
          const ia = NOTE_COLORS.findIndex((c) => c.value === a.color);
          const ib = NOTE_COLORS.findIndex((c) => c.value === b.color);
          return ia !== ib ? ia - ib : b.updated_at.localeCompare(a.updated_at);
        }
        default:
          return b.updated_at.localeCompare(a.updated_at);
      }
    });
  }, [notes, sortMode]);

  const linkableExpenses = useMemo(() => {
    return [...expenses]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 50);
  }, [expenses]);

  if (!mounted || !loaded) {
    return (
      <div className="notebook-paper min-h-screen p-8 pt-16 lg:pl-20">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-paper-dark rounded" />
          <div className="grid grid-cols-2 gap-4 mt-4">
            {[1, 2, 3, 4].map((i) => <div key={i} className="h-32 bg-paper-dark rounded" />)}
          </div>
        </div>
      </div>
    );
  }

  const resetForm = () => {
    setTitle(""); setContent(""); setColor("#FEF9C3"); setEditing(null); setLinkedExpenseId(null);
  };

  const handleSave = async () => {
    if (!title.trim() && !content.trim()) return;
    try {
      if (editing) {
        await updateNote(editing.id, { title: title.trim(), content: content.trim(), color, expense_id: linkedExpenseId });
        toast("Note updated");
      } else {
        await addNote({ title: title.trim(), content: content.trim(), color, pinned: false, expense_id: linkedExpenseId });
        toast("Note added");
      }
      resetForm();
      setShowEditor(false);
    } catch (err) {
      console.error("Failed to save note:", err);
      toast("Failed to save note", "error");
    }
  };

  const startEdit = (note: Note) => {
    setEditing(note);
    setTitle(note.title); setContent(note.content); setColor(note.color);
    setLinkedExpenseId(note.expense_id ?? null);
    setShowEditor(true);
  };

  return (
    <div className="notebook-paper min-h-screen page-enter">
      <div className="max-w-3xl mx-auto px-4 sm:px-8 py-8 pt-16 lg:pl-20">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8 border-b border-[rgba(0,0,0,0.06)] pb-4 header-gradient">
          <div className="flex items-center gap-1">
            <BackButton />
            <div>
              <h1 className="font-handwritten text-4xl text-ink-dark font-semibold">Expense Diary Notes</h1>
              <p className="text-xs text-ink-light mt-0.5">Jot down grocery lists, dynamic budgeting ideas, or reminders.</p>
            </div>
          </div>
          <button
            onClick={() => requireAuth(() => { resetForm(); setShowEditor(true); })}
            className="flex items-center gap-1.5 px-4 py-2 bg-accent-warm text-white rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity shadow-sm cursor-pointer"
          >
            <Plus size={16} /> New Note
          </button>
        </div>

        {/* Note Editor Modal/Card */}
        {showEditor && (
          <div
            className={`paper-card p-6 mb-8 page-enter relative rotate-[-0.5deg] shadow-lg border-l-4 border-l-accent-warm ${
              dragColor && dropTargetId === "editor" ? "ring-2 ring-accent-warm" : ""
            }`}
            style={{ backgroundColor: color }}
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = "copy";
              setDropTargetId("editor");
            }}
            onDragLeave={() => setDropTargetId((cur) => (cur === "editor" ? null : cur))}
            onDrop={(e) => {
              e.preventDefault();
              const dropped = e.dataTransfer.getData("text/plain") || dragColor || "";
              if (isNoteColor(dropped)) setColor(dropped);
              setDropTargetId(null);
            }}
          >
            {/* Clear Tape strip at top */}
            <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-14 h-4 bg-white/50 border border-white/20 shadow-sm rotate-1 rounded-sm" />

            <div className="flex items-center justify-between mb-4 border-b border-[rgba(0,0,0,0.06)] pb-2">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Note title..."
                className="flex-1 bg-transparent border-none text-[#2C2C2C] font-handwritten text-xl font-bold placeholder:text-black/30 focus:outline-none"
                autoFocus
              />
              <button
                onClick={() => { resetForm(); setShowEditor(false); }}
                className="p-1 hover:bg-black/10 rounded text-black/40 hover:text-[#2C2C2C] cursor-pointer"
                aria-label="Close editor"
              >
                <X size={16} />
              </button>
            </div>

            <AutoResizeTextarea value={content} onChange={setContent} />

            <div className="mt-3 pt-2.5 border-t border-[rgba(0,0,0,0.06)]">
              {linkedExpenseId ? (
                (() => {
                  const linked = expenses.find((e) => e.id === linkedExpenseId);
                  return (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="inline-flex items-center gap-1 max-w-full pl-2 pr-1 py-0.5 rounded-full bg-black/5 border border-black/10 text-[10px] font-semibold text-[#2C2C2C]">
                        <ReceiptText size={10} className="shrink-0 text-black/50" />
                        <span className="truncate py-0.5">
                          {linked
                            ? `${getCategoryByName(linked.category)?.icon ?? "🧾"} ${linked.name} · ${formatCurrency(linked.amount)} · ${format(new Date(`${linked.date}T00:00:00`), "MMM d")}`
                            : "Linked expense"}
                        </span>
                        <button
                          type="button"
                          onClick={() => setLinkedExpenseId(null)}
                          className="p-0.5 rounded-full hover:bg-black/10 text-black/40 hover:text-red-600 cursor-pointer"
                          aria-label="Remove expense link"
                        >
                          <X size={11} />
                        </button>
                      </span>
                    </div>
                  );
                })()
              ) : (
                <label className="flex items-center gap-1.5 min-w-0">
                  <Link2 size={13} className="shrink-0 text-black/35" />
                  <select
                    value=""
                    onChange={(e) => setLinkedExpenseId(e.target.value || null)}
                    aria-label="Link this note to an expense"
                    title="Attach this note to one of your expenses"
                    className="min-w-0 flex-1 bg-transparent border-none text-[11px] text-black/45 focus:outline-none cursor-pointer appearance-none"
                  >
                    <option value="">+ Link to an expense…</option>
                    {linkableExpenses.map((exp) => (
                      <option key={exp.id} value={exp.id}>
                        {exp.name} · {formatCurrency(exp.amount)} · {format(new Date(`${exp.date}T00:00:00`), "MMM d, yyyy")}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={12} className="shrink-0 -ml-4 text-black/30 pointer-events-none" />
                </label>
              )}
            </div>

            <div className="flex items-center justify-between mt-4 pt-3 border-t border-[rgba(0,0,0,0.06)] flex-wrap gap-y-2">
              <div className="flex items-center gap-2">
                {NOTE_COLORS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setColor(c.value)}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData("text/plain", c.value);
                      e.dataTransfer.effectAllowed = "copy";
                      setDragColor(c.value);
                    }}
                    onDragEnd={() => { setDragColor(null); setDropTargetId(null); }}
                    className={`w-6 h-6 rounded-full border-2 transition-transform cursor-grab active:cursor-grabbing hover:scale-110 ${
                      color === c.value ? "border-[#2C2C2C] scale-110 shadow-sm" : "border-transparent"
                    }`}
                    style={{ backgroundColor: c.value }}
                    aria-label={`Select color ${c.name}`}
                    title={`${c.name} — click to use here, or drag onto a note`}
                  />
                ))}
              </div>
              <div className="flex items-center gap-3 ml-auto">
                <span className="text-[10px] text-black/40 font-medium" aria-live="polite">
                  {countWords(content)} words · {content.length} characters
                </span>
                <button
                  onClick={handleSave}
                  disabled={!title.trim() && !content.trim()}
                  className="px-4 py-1.5 bg-accent-warm text-white rounded-lg text-xs font-semibold hover:opacity-90 disabled:opacity-50 flex items-center gap-1 cursor-pointer"
                >
                  <Check size={14} /> {editing ? "Update" : "Save Note"}
                </button>
              </div>
              {dragColor && (
                <p className="w-full text-[10px] text-black/40">
                  Drop the color anywhere on this editor or on any note below.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Sticky Notes Grid */}
        {sorted.length === 0 ? (
          <div className="paper-card p-12 text-center relative overflow-hidden">
            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-20 h-4 bg-amber-200/30 border border-amber-300/20 rotate-[-2deg] rounded-sm pointer-events-none" />
            <span className="text-6xl block mb-3">📌</span>
            <p className="font-handwritten text-3xl text-ink-dark font-semibold">Your corkboard is empty</p>
            <p className="text-xs text-ink-light mt-2 max-w-xs mx-auto leading-relaxed mb-8">
              Jot down your first note — grocery lists, ideas, reminders, anything.
            </p>
            <button
              onClick={() => requireAuth(() => { resetForm(); setShowEditor(true); })}
              className="group relative block mx-auto w-52 h-44 bg-[#FEF9C3] dark:bg-[#3D3520] rounded-md shadow-md rotate-[-2deg] hover:rotate-0 hover:shadow-lg transition-all p-4 text-left cursor-pointer"
              aria-label="Write your first note"
            >
              <span className="absolute -top-2 left-1/2 -translate-x-1/2 w-12 h-3.5 bg-white/40 shadow-sm border border-white/10 rotate-[2deg] rounded-sm pointer-events-none" aria-hidden="true" />
              <span className="font-handwritten text-xl text-ink-dark/80 leading-relaxed break-words">
                Jot something down<span className="cursor-blink font-sans">|</span>
              </span>
              <span className="absolute bottom-3 right-4 text-lg opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all" aria-hidden="true">✍️</span>
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
              <p className="text-xs text-ink-light">
                {sorted.length} note{sorted.length === 1 ? "" : "s"} · pinned first
              </p>
              <div className="flex items-center gap-2">
                <div className="flex rounded-lg border border-[rgba(0,0,0,0.08)] bg-paper-bg p-0.5" role="group" aria-label="Note layout">
                  <button
                    onClick={() => { setLayout("grid"); savePref("notes_layout_v1", "grid"); }}
                    className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                      layout === "grid" ? "bg-accent-warm text-white shadow-sm" : "text-ink-light hover:text-ink-dark"
                    }`}
                    aria-label="Grid layout"
                    aria-pressed={layout === "grid"}
                    title="Grid layout"
                  >
                    <LayoutGrid size={14} />
                  </button>
                  <button
                    onClick={() => { setLayout("masonry"); savePref("notes_layout_v1", "masonry"); }}
                    className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                      layout === "masonry" ? "bg-accent-warm text-white shadow-sm" : "text-ink-light hover:text-ink-dark"
                    }`}
                    aria-label="Masonry layout"
                    aria-pressed={layout === "masonry"}
                    title="Masonry layout"
                  >
                    <Columns3 size={14} />
                  </button>
                </div>
                <div className="relative">
                  <ArrowDownUp size={13} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-light" />
                  <select
                    value={sortMode}
                    onChange={(e) => {
                      const mode = e.target.value as NoteSortMode;
                      setSortMode(mode);
                      savePref("notes_sort_v1", mode);
                    }}
                    aria-label="Sort notes"
                    title={`Sorted by ${SORT_LABELS[sortMode].toLowerCase()}`}
                    className="bg-paper-bg border border-[rgba(0,0,0,0.08)] rounded-lg text-sm text-ink-dark h-9 pl-8 pr-8 appearance-none truncate cursor-pointer focus:outline-none focus-visible:border-accent-warm focus-visible:ring-2 focus-visible:ring-accent-warm/25"
                  >
                    {NOTE_SORT_MODES.map((mode) => (
                      <option key={mode} value={mode}>{SORT_LABELS[mode]}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-light" />
                </div>
              </div>
            </div>

            <div className={layout === "masonry" ? "columns-1 sm:columns-2 gap-6 pt-2" : "grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2"}>
              {sorted.map((note, index) => {
                const rotateClass = TILTS[index % TILTS.length];
                const isDropTarget = dropTargetId === note.id;
                const linkedExpense = note.expense_id
                  ? expenses.find((e) => e.id === note.expense_id)
                  : undefined;
                return (
                  <div
                    key={note.id}
                    className={`p-5 rounded-lg shadow-sm hover:shadow-md relative group transition-all duration-300 cursor-pointer ${rotateClass} note-card ${
                      layout === "masonry" ? "mb-6 break-inside-avoid" : ""
                    } ${isDropTarget ? "ring-2 ring-accent-warm ring-offset-2 scale-[1.02]" : ""}`}
                    style={{ backgroundColor: note.color, minHeight: "150px" }}
                    onClick={() => startEdit(note)}
                    onDragOver={(e) => {
                      if (!dragColor) return;
                      e.preventDefault();
                      e.dataTransfer.dropEffect = "copy";
                      setDropTargetId(note.id);
                    }}
                    onDragLeave={() => setDropTargetId((cur) => (cur === note.id ? null : cur))}
                    onDrop={(e) => {
                      e.preventDefault();
                      const dropped = e.dataTransfer.getData("text/plain") || dragColor || "";
                      if (isNoteColor(dropped) && dropped !== note.color) {
                        updateNote(note.id, { color: dropped });
                        toast("Note color updated");
                      }
                      setDropTargetId(null);
                    }}
                  >
                    {/* Clear Tape strip at top of note */}
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-12 h-3.5 bg-white/40 shadow-sm border border-white/10 rotate-[-1deg] rounded-sm pointer-events-none" />

                    {/* Header / Pin Button */}
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-handwritten text-lg font-bold text-[#2C2C2C] flex-1 truncate pr-2">
                        {note.title || "Untitled Note"}
                      </h3>

                      {/* Control Buttons (always semi-opaque on touch, hover opaque on desktop) */}
                      <div className="flex gap-1 opacity-60 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            updateNote(note.id, { pinned: !note.pinned });
                            toast(note.pinned ? "Note unpinned" : "Note pinned");
                          }}
                          className="p-1 hover:bg-black/10 rounded text-black/50 hover:text-[#2C2C2C] cursor-pointer"
                          aria-label={note.pinned ? "Unpin note" : "Pin note"}
                        >
                          {note.pinned ? <PinOff size={13} /> : <Pin size={13} />}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteConfirm(note.id);
                          }}
                          className="p-1 hover:bg-black/10 rounded text-black/50 hover:text-red-600 cursor-pointer"
                          aria-label="Delete note"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    {note.pinned && (
                      <span className="inline-block text-[9px] bg-black/10 text-black/60 font-bold px-1.5 py-0.5 rounded uppercase tracking-wider mb-2">
                        📌 Pinned
                      </span>
                    )}

                    <p className={`text-xs text-[#333333] whitespace-pre-wrap leading-relaxed mt-1 ${layout === "masonry" ? "" : "line-clamp-5"}`}>
                      {note.content}
                    </p>

                    {linkedExpense && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/expenses?q=${encodeURIComponent(linkedExpense.name)}`);
                        }}
                        className="mt-2.5 max-w-full inline-flex items-center gap-1 pl-2 pr-2 py-0.5 rounded-full bg-white/50 hover:bg-white/80 border border-black/10 text-[10px] font-semibold text-[#2C2C2C] transition-colors cursor-pointer"
                        title="View this expense in your journal"
                        aria-label={`Open linked expense ${linkedExpense.name}`}
                      >
                        <ReceiptText size={10} className="shrink-0 opacity-50" />
                        <span className="truncate">
                          {getCategoryByName(linkedExpense.category)?.icon ?? "🧾"} {linkedExpense.name}
                        </span>
                        <span className="shrink-0 amount">{formatCurrency(linkedExpense.amount)}</span>
                      </button>
                    )}

                    <div className="text-[9px] text-black/40 mt-4 border-t border-black/10 pt-2 flex items-center justify-between font-medium gap-2">
                      <span>{countWords(note.content)} words · {note.content.length} chars</span>
                      <span>Updated: {format(new Date(note.updated_at), "MMM d, yyyy")}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      <AuthPrompt open={showAuthPrompt} onClose={() => setShowAuthPrompt(false)} feature="notes" />
      <ConfirmDialog
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => {
          if (deleteConfirm) {
            deleteNote(deleteConfirm);
            toast("Note deleted");
            setDeleteConfirm(null);
          }
        }}
        title="Delete note?"
        message="This will permanently remove this note."
      />
    </div>
  );
}
