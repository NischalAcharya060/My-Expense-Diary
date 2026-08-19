"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Pin, PinOff, Edit2, X, Check } from "lucide-react";
import { useNotes } from "@/lib/store";
import { format } from "date-fns";
import type { Note } from "@/types";
import { useRequireAuth } from "@/lib/useRequireAuth";
import AuthPrompt from "@/components/AuthPrompt";

const NOTE_COLORS = [
  { name: "Yellow", value: "#FEF9C3" },
  { name: "Green", value: "#DCFCE7" },
  { name: "Blue", value: "#DBEAFE" },
  { name: "Pink", value: "#FCE7F3" },
  { name: "Purple", value: "#F3E8FF" },
  { name: "Orange", value: "#FFEDD5" },
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
  const [mounted, setMounted] = useState(false);
  const { requireAuth, showAuthPrompt, setShowAuthPrompt } = useRequireAuth();

  useEffect(() => setMounted(true), []);

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
      } else {
        await addNote({ user_id: "", title: title.trim(), content: content.trim(), color, pinned: false });
      }
      resetForm();
      setShowEditor(false);
    } catch (err) {
      console.error("Failed to save note:", err);
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
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-handwritten text-3xl sm:text-4xl text-ink-dark">Notes</h1>
          <button
            onClick={() => requireAuth(() => { resetForm(); setShowEditor(true); })}
            className="flex items-center gap-1.5 px-3 py-2 bg-accent-warm text-white rounded text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Plus size={16} /> New Note
          </button>
        </div>

        {/* Editor */}
        {showEditor && (
          <div className="paper-card p-4 mb-6 page-enter" style={{ backgroundColor: color }}>
            <div className="flex items-center justify-between mb-3">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Note title..."
                className="flex-1 bg-transparent border-none text-ink-dark font-handwritten text-xl placeholder:text-ink-light/50 focus:outline-none"
                autoFocus
              />
              <button onClick={() => { resetForm(); setShowEditor(false); }} className="p-1 text-ink-light hover:text-ink-dark">
                <X size={16} />
              </button>
            </div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your note here..."
              rows={4}
              className="w-full bg-transparent border-none text-ink-dark text-sm placeholder:text-ink-light/50 focus:outline-none resize-none"
            />
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-[rgba(0,0,0,0.08)]">
              <div className="flex gap-2">
                {NOTE_COLORS.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => setColor(c.value)}
                    className={`w-6 h-6 rounded-full border-2 transition-transform ${color === c.value ? "border-ink-dark scale-110" : "border-transparent"}`}
                    style={{ backgroundColor: c.value }}
                    title={c.name}
                  />
                ))}
              </div>
              <button
                onClick={handleSave}
                disabled={!title.trim() && !content.trim()}
                className="px-3 py-1.5 bg-accent-warm text-white rounded text-xs font-medium hover:opacity-90 disabled:opacity-50 flex items-center gap-1"
              >
                <Check size={14} /> {editing ? "Update" : "Save"}
              </button>
            </div>
          </div>
        )}

        {/* Notes grid */}
        {sorted.length === 0 ? (
          <div className="paper-card p-8 text-center">
            <p className="font-handwritten text-xl text-ink-light">No notes yet</p>
            <p className="text-xs text-ink-light mt-2">Start writing your thoughts!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {sorted.map((note) => (
              <div
                key={note.id}
                className="p-4 rounded-lg shadow-sm relative group transition-all hover:shadow-md cursor-pointer"
                style={{ backgroundColor: note.color }}
                onClick={() => startEdit(note)}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-handwritten text-lg text-ink-dark flex-1 truncate">{note.title || "Untitled"}</h3>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); updateNote(note.id, { pinned: !note.pinned }); }}
                      className="p-1 text-ink-light hover:text-ink-dark"
                    >
                      {note.pinned ? <PinOff size={12} /> : <Pin size={12} />}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteNote(note.id); }}
                      className="p-1 text-ink-light hover:text-accent-red"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
                {note.pinned && <span className="text-[10px] text-ink-light uppercase">📌 Pinned</span>}
                <p className="text-sm text-ink-medium line-clamp-4 whitespace-pre-wrap mt-1">{note.content}</p>
                <p className="text-[10px] text-ink-light mt-3">
                  {format(new Date(note.updated_at), "MMM d, yyyy")}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <AuthPrompt open={showAuthPrompt} onClose={() => setShowAuthPrompt(false)} feature="notes" />
    </div>
  );
}

