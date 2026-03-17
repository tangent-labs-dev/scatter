"use client";

import { useEffect, useState } from "react";
import { CanvasView } from "@/components/canvas/canvas-view";
import type { NoteColor, NoteRecord } from "@/lib/db/schema";
import {
  createNote,
  deleteNote,
  listNotes,
  setNoteColor,
  toggleNoteDone,
  updateNote,
} from "@/lib/repositories/notes-repository";

export default function HomePage() {
  const [notes, setNotes] = useState<NoteRecord[]>([]);

  useEffect(() => {
    void (async () => {
      setNotes(await listNotes());
    })();
  }, []);

  async function handleCreateAt(x: number, y: number) {
    const created = await createNote({ x, y, text: "" });
    setNotes((prev) => [...prev, created]);
    return created;
  }

  function handleMovePreview(noteId: string, x: number, y: number) {
    setNotes((prev) => prev.map((n) => (n.id === noteId ? { ...n, x, y } : n)));
  }

  async function handleMoveCommit(noteId: string, x: number, y: number) {
    await updateNote(noteId, { x, y });
  }

  async function handleTextCommit(noteId: string, text: string) {
    await updateNote(noteId, { text });
  }

  async function handleToggleDone(noteId: string) {
    const next = await toggleNoteDone(noteId);
    if (!next) return;
    setNotes((prev) => prev.map((n) => (n.id === noteId ? next : n)));
  }

  async function handleColorChange(noteId: string, color: NoteColor) {
    const next = await setNoteColor(noteId, color);
    if (!next) return;
    setNotes((prev) => prev.map((n) => (n.id === noteId ? next : n)));
  }

  async function handleDelete(noteId: string) {
    await deleteNote(noteId);
    setNotes((prev) => prev.filter((n) => n.id !== noteId));
  }

  return (
    <CanvasView
      notes={notes}
      onCreateAt={handleCreateAt}
      onMovePreview={handleMovePreview}
      onMoveCommit={handleMoveCommit}
      onTextCommit={handleTextCommit}
      onToggleDone={handleToggleDone}
      onColorChange={handleColorChange}
      onDelete={handleDelete}
    />
  );
}
