"use client";

import { useSyncExternalStore, useState } from "react";
import { Plus, Trash2, Pin, PinOff, X, Check } from "lucide-react";
import { useNotes } from "@/lib/store";
import { format } from "date-fns";
import type { Note } from "@/types";
import { useRequireAuth } from "@/lib/useRequireAuth";
import AuthPrompt from "@/components/AuthPrompt";
import ConfirmDialog from "@/components/ConfirmDialog";
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

export default function NotesPage() {
  return <NotesContent />;
}

function NotesContent() {
  const { notes, loaded, addNote, updateNote, deleteNote } = useNotes();
  const [showEditor, setShowEditor] = useState(false);
  const [editing, setEditing] = useState<Note | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [color, setColor] = useState("#FEF9C3");
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const { requireAuth, showAuthPrompt, setShowAuthPrompt } = useRequireAuth();
  const { toast } = useToast();

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

  const sorted = [...notes].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return b.updated_at.localeCompare(a.updated_at);
  });

  const resetForm = () => {
    setTitle(""); setContent(""); setColor("#FEF9C3"); setEditing(null);
  };

  const handleSave = async () => {
    if (!title.trim() && !content.trim()) return;
    try {
      if (editing) {
        await updateNote(editing.id, { title: title.trim(), content: content.trim(), color });
        toast("Note updated");
      } else {
        await addNote({ title: title.trim(), content: content.trim(), color, pinned: false });
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
    setShowEditor(true);
  };

  return (
    <div className="notebook-paper min-h-screen page-enter">
      <div className="max-w-3xl mx-auto px-4 sm:px-8 py-8 pt-16 lg:pl-20">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8 border-b border-[rgba(0,0,0,0.06)] pb-4">
          <div>
            <h1 className="font-handwritten text-4xl text-ink-dark font-semibold">Expense Diary Notes</h1>
            <p className="text-xs text-ink-light mt-0.5">Jot down grocery lists, dynamic budgeting ideas, or reminders.</p>
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
            className="paper-card p-6 mb-8 page-enter relative rotate-[-0.5deg] shadow-lg border-l-4 border-l-accent-warm" 
            style={{ backgroundColor: color }}
          >
            {/* Clear Tape strip at top */}
            <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-14 h-4 bg-white/50 border border-white/20 shadow-sm rotate-1 rounded-sm" />
            
            <div className="flex items-center justify-between mb-4 border-b border-[rgba(0,0,0,0.06)] pb-2">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Note title..."
                className="flex-1 bg-transparent border-none text-ink-dark font-handwritten text-xl font-bold placeholder:text-ink-light/50 focus:outline-none"
                autoFocus
              />
              <button 
                onClick={() => { resetForm(); setShowEditor(false); }} 
                className="p-1 hover:bg-black/5 rounded text-ink-light hover:text-ink-dark cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
            
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your thoughts here..."
              rows={5}
              className="w-full bg-transparent border-none text-ink-dark text-sm placeholder:text-ink-light/50 focus:outline-none resize-none font-medium leading-relaxed"
            />
            
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-[rgba(0,0,0,0.06)]">
              <div className="flex gap-2">
                {NOTE_COLORS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setColor(c.value)}
                    className={`w-6 h-6 rounded-full border-2 transition-transform cursor-pointer hover:scale-110 ${
                      color === c.value ? "border-ink-dark scale-110 shadow-sm" : "border-transparent"
                    }`}
                    style={{ backgroundColor: c.value }}
                    title={c.name}
                  />
                ))}
              </div>
              <button
                onClick={handleSave}
                disabled={!title.trim() && !content.trim()}
                className="px-4 py-1.5 bg-accent-warm text-white rounded-lg text-xs font-semibold hover:opacity-90 disabled:opacity-50 flex items-center gap-1 cursor-pointer"
              >
                <Check size={14} /> {editing ? "Update" : "Save Note"}
              </button>
            </div>
          </div>
        )}

        {/* Sticky Notes Grid */}
        {sorted.length === 0 ? (
          <div className="paper-card p-12 text-center">
            <span className="text-4xl block mb-2 font-handwritten">📌</span>
            <p className="font-handwritten text-2xl text-ink-light">Your corkboard is empty</p>
            <p className="text-xs text-ink-light mt-1">Add sticky notes above to organize your thoughts.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
            {sorted.map((note, index) => {
              const rotateClass = TILTS[index % TILTS.length];
              return (
                <div
                  key={note.id}
                  className={`p-5 rounded-lg shadow-sm hover:shadow-md relative group transition-all duration-300 cursor-pointer ${rotateClass}`}
                  style={{ backgroundColor: note.color, minHeight: "150px" }}
                  onClick={() => startEdit(note)}
                >
                  {/* Clear Tape strip at top of note */}
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-12 h-3.5 bg-white/40 shadow-sm border border-white/10 rotate-[-1deg] rounded-sm pointer-events-none" />

                  {/* Header / Pin Button */}
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-handwritten text-lg font-bold text-ink-dark dark:text-black flex-1 truncate pr-2">
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
                        className="p-1 hover:bg-black/5 dark:hover:bg-black/10 rounded text-ink-light dark:text-black/60 hover:text-ink-dark dark:hover:text-black cursor-pointer"
                        title={note.pinned ? "Unpin note" : "Pin note"}
                      >
                        {note.pinned ? <PinOff size={13} /> : <Pin size={13} />}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirm(note.id);
                        }}
                        className="p-1 hover:bg-black/5 dark:hover:bg-black/10 rounded text-ink-light dark:text-black/60 hover:text-accent-red cursor-pointer"
                        title="Delete note"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                  
                  {note.pinned && (
                    <span className="inline-block text-[9px] bg-black/5 dark:bg-black/10 text-ink-medium dark:text-black/70 font-bold px-1.5 py-0.5 rounded uppercase tracking-wider mb-2">
                      📌 Pinned
                    </span>
                  )}
                  
                  <p className="text-xs text-ink-medium dark:text-black/80 line-clamp-5 whitespace-pre-wrap leading-relaxed mt-1">
                    {note.content}
                  </p>
                  
                  <p className="text-[9px] text-ink-light/80 dark:text-black/50 mt-4 border-t border-black/5 pt-2 text-right font-medium">
                    Updated: {format(new Date(note.updated_at), "MMM d, yyyy")}
                  </p>
                </div>
              );
            })}
          </div>
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
