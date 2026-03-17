"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { NoteCard } from "@/components/notes/note-card";
import type { NoteColor, NoteRecord } from "@/lib/db/schema";

type Viewport = { x: number; y: number; scale: number };

type Props = {
  notes: NoteRecord[];
  onCreateAt: (x: number, y: number) => Promise<void>;
  onMovePreview: (noteId: string, x: number, y: number) => void;
  onMoveCommit: (noteId: string, x: number, y: number) => Promise<void>;
  onTextCommit: (noteId: string, text: string) => Promise<void>;
  onToggleDone: (noteId: string) => Promise<void>;
  onColorChange: (noteId: string, color: NoteColor) => Promise<void>;
  onDelete: (noteId: string) => Promise<void>;
};

export function CanvasView({
  notes,
  onCreateAt,
  onMovePreview,
  onMoveCommit,
  onTextCommit,
  onToggleDone,
  onColorChange,
  onDelete,
}: Props) {
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const [viewport, setViewport] = useState<Viewport>({ x: 0, y: 0, scale: 1 });
  const [spacePressed, setSpacePressed] = useState(false);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);

  const [panDrag, setPanDrag] = useState<null | {
    startClientX: number;
    startClientY: number;
    startX: number;
    startY: number;
  }>(null);

  const [noteDrag, setNoteDrag] = useState<null | {
    noteId: string;
    startClientX: number;
    startClientY: number;
    startNoteX: number;
    startNoteY: number;
  }>(null);

  useEffect(() => {
    const isTypingTarget = (target: EventTarget | null) => {
      const el = target as HTMLElement | null;
      if (!el) return false;
      const tag = el.tagName.toLowerCase();
      return tag === "input" || tag === "textarea" || el.isContentEditable;
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code !== "Space") return;
      if (isTypingTarget(e.target)) return;
      e.preventDefault();
      setSpacePressed(true);
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code !== "Space") return;
      setSpacePressed(false);
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (panDrag) {
        setViewport((prev) => ({
          ...prev,
          x: panDrag.startX + (e.clientX - panDrag.startClientX),
          y: panDrag.startY + (e.clientY - panDrag.startClientY),
        }));
      }

      if (noteDrag) {
        const dx = (e.clientX - noteDrag.startClientX) / viewport.scale;
        const dy = (e.clientY - noteDrag.startClientY) / viewport.scale;
        onMovePreview(
          noteDrag.noteId,
          noteDrag.startNoteX + dx,
          noteDrag.startNoteY + dy,
        );
      }
    };

    const onUp = async () => {
      if (noteDrag) {
        const note = notes.find((n) => n.id === noteDrag.noteId);
        if (note) await onMoveCommit(note.id, note.x, note.y);
      }
      setPanDrag(null);
      setNoteDrag(null);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);

    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [panDrag, noteDrag, notes, onMoveCommit, onMovePreview, viewport.scale]);

  const cursorClass = useMemo(() => {
    if (panDrag) return "cursor-grabbing";
    if (spacePressed) return "cursor-grab";
    return "cursor-default";
  }, [spacePressed, panDrag]);

  const selectedNote = useMemo(
    () => notes.find((note) => note.id === selectedNoteId) ?? null,
    [notes, selectedNoteId],
  );

  function toWorld(clientX: number, clientY: number) {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return null;
    return {
      x: (clientX - rect.left - viewport.x) / viewport.scale,
      y: (clientY - rect.top - viewport.y) / viewport.scale,
    };
  }

  async function handleDoubleClick(e: React.MouseEvent<HTMLDivElement>) {
    const point = toWorld(e.clientX, e.clientY);
    if (!point) return;
    await onCreateAt(point.x, point.y);
  }

  async function handleCreateFromDock() {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const centerClientX = rect.left + rect.width / 2;
    const centerClientY = rect.top + rect.height / 2;
    const point = toWorld(centerClientX, centerClientY);
    if (!point) return;
    await onCreateAt(point.x - 140, point.y - 90);
  }

  function handleCanvasPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    const middleMouse = e.button === 1;
    const shouldPan = spacePressed || middleMouse;
    if (!shouldPan) {
      setSelectedNoteId(null);
      return;
    }

    e.preventDefault();
    setPanDrag({
      startClientX: e.clientX,
      startClientY: e.clientY,
      startX: viewport.x,
      startY: viewport.y,
    });
  }

  function handleWheel(e: React.WheelEvent<HTMLDivElement>) {
    // Trackpad and mouse wheel pans the viewport
    e.preventDefault();
    setViewport((prev) => ({
      ...prev,
      x: prev.x - e.deltaX,
      y: prev.y - e.deltaY,
    }));
  }

  return (
    <main className="h-svh w-full overflow-hidden bg-zinc-950 text-zinc-100">
      <div
        ref={canvasRef}
        className={`relative h-full w-full select-none touch-none ${cursorClass}`}
        onDoubleClick={handleDoubleClick}
        onPointerDown={handleCanvasPointerDown}
        onWheel={handleWheel}
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(255,255,255,0.16) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle_at_18%_20%,rgba(255,255,255,0.08),transparent_30%),radial-gradient(circle_at_85%_70%,rgba(239,68,68,0.12),transparent_36%)]"
        />
        <div
          className="absolute left-4 right-4 top-4 z-20 flex items-center justify-between gap-4 rounded-2xl border border-zinc-700/80 bg-zinc-900/85 px-4 py-3 shadow-[0_14px_34px_rgba(0,0,0,0.5)] backdrop-blur"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md border border-zinc-600 bg-zinc-950 text-sm font-bold text-zinc-200">
                ∞
              </div>
              <span className="font-mono text-xs font-semibold uppercase tracking-[0.24em] text-zinc-100">
                Scatter Board
              </span>
            </div>
            <nav className="hidden items-center gap-4 font-mono text-[11px] uppercase tracking-[0.16em] text-zinc-500 md:flex">
              <span className="text-zinc-200">Local</span>
              <span>Live</span>
              <span>Archive</span>
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <input
              value={selectedNote ? `Selected: ${selectedNote.id.slice(0, 6)}` : ""}
              readOnly
              placeholder="No note selected"
              className="hidden w-56 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-1.5 font-mono text-xs uppercase tracking-[0.14em] text-zinc-300 placeholder:text-zinc-600 outline-none lg:block"
            />

            <select
              value={selectedNote?.color ?? "offwhite"}
              disabled={!selectedNote}
              className="rounded-lg border border-zinc-700 bg-zinc-950 px-2.5 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-300 outline-none transition hover:border-zinc-500 disabled:cursor-not-allowed disabled:opacity-50"
              onChange={(e) => {
                if (!selectedNote) return;
                void onColorChange(selectedNote.id, e.target.value as NoteColor);
              }}
            >
              <option value="offwhite">Ice</option>
              <option value="gray">Mist</option>
              <option value="olive">Paper</option>
              <option value="bluegray">Steel</option>
              <option value="ashbrown">Stone</option>
              <option value="graphite">Carbon</option>
            </select>

            <button
              className="rounded-lg border border-zinc-700 bg-zinc-950 px-2.5 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-200 transition hover:border-zinc-500 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!selectedNote}
              onClick={() => {
                if (!selectedNote) return;
                void onToggleDone(selectedNote.id);
              }}
            >
              {selectedNote?.done ? "Mark Active" : "Mark Done"}
            </button>

            <button
              className="rounded-lg border border-white bg-zinc-100 px-3 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-950 transition hover:bg-white"
              onClick={() => void handleCreateFromDock()}
            >
              + Note
            </button>

            <button
              className="rounded-lg border border-red-500/70 bg-zinc-950 px-2.5 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-red-400 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!selectedNote}
              onClick={() => {
                if (!selectedNote) return;
                void onDelete(selectedNote.id);
                setSelectedNoteId(null);
              }}
            >
              Delete
            </button>
          </div>
        </div>

        <div
          className="absolute inset-0 origin-top-left"
          style={{
            transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.scale})`,
          }}
        >
          {notes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              isSelected={selectedNoteId === note.id}
              onSelect={() => setSelectedNoteId(note.id)}
              onStartDrag={(clientX, clientY) => {
                setNoteDrag({
                  noteId: note.id,
                  startClientX: clientX,
                  startClientY: clientY,
                  startNoteX: note.x,
                  startNoteY: note.y,
                });
              }}
              onTextCommit={(text) => onTextCommit(note.id, text)}
            />
          ))}
        </div>

        <div className="pointer-events-none absolute bottom-6 left-6 z-20 flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900/85 px-3 py-2 font-mono text-[11px] uppercase tracking-[0.16em] text-zinc-400 backdrop-blur">
          <span className="rounded-md border border-zinc-700 px-2 py-1">-</span>
          <span>100%</span>
          <span className="rounded-md border border-zinc-700 px-2 py-1">+</span>
        </div>
      </div>
    </main>
  );
}
