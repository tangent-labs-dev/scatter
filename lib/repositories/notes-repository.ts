import { db } from "@/lib/db/client";
import type { NoteColor, NoteRecord } from "@/lib/db/schema";

const DEFAULT_CANVAS_ID = "default-canvas";

function nowIso() {
  return new Date().toISOString();
}

export async function listNotes(canvasId = DEFAULT_CANVAS_ID) {
  return db.notes
    .where("canvasId")
    .equals(canvasId)
    .filter((n) => n.deletedAt === null)
    .toArray();
}

export async function createNote(input: Partial<NoteRecord> = {}) {
  const now = nowIso();

  const note: NoteRecord = {
    id: crypto.randomUUID(),
    canvasId: input.canvasId ?? DEFAULT_CANVAS_ID,
    text: input.text ?? "",
    color: input.color ?? "offwhite",
    done: input.done ?? false,
    x: input.x ?? 0,
    y: input.y ?? 0,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    version: 1,
  };

  await db.notes.put(note);
  return note;
}

export async function updateNote(id: string, patch: Partial<NoteRecord>) {
  const existing = await db.notes.get(id);
  if (!existing) return null;

  const next: NoteRecord = {
    ...existing,
    ...patch,
    updatedAt: nowIso(),
    version: existing.version + 1,
  };

  await db.notes.put(next);
  return next;
}

export async function deleteNote(id: string) {
  return updateNote(id, { deletedAt: nowIso() });
}

export async function setNoteColor(id: string, color: NoteColor) {
  return updateNote(id, { color });
}

export async function toggleNoteDone(id: string) {
  const existing = await db.notes.get(id);
  if (!existing) return null;
  return updateNote(id, { done: !existing.done });
}
