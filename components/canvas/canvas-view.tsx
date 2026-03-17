"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { NoteCard } from "@/components/notes/note-card";
import type { NoteColor, NoteRecord } from "@/lib/db/schema";

type Viewport = { x: number; y: number; scale: number };
type Rect = { x: number; y: number; width: number; height: number };
const NOTE_COLORS_ORDER: NoteColor[] = [
  "offwhite",
  "gray",
  "olive",
  "bluegray",
  "ashbrown",
  "graphite",
];

function isTypingTarget(target: EventTarget | null) {
  const el = target as HTMLElement | null;
  if (!el) return false;
  const tag = el.tagName.toLowerCase();
  return tag === "input" || tag === "textarea" || el.isContentEditable;
}

type Props = {
  notes: NoteRecord[];
  onCreateAt: (x: number, y: number) => Promise<NoteRecord>;
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
  const [canvasSize, setCanvasSize] = useState({ width: 1, height: 1 });

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
    if (!canvasRef.current) return;

    const updateSize = () => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      setCanvasSize({ width: Math.max(rect.width, 1), height: Math.max(rect.height, 1) });
    };

    updateSize();

    const observer = new ResizeObserver(updateSize);
    observer.observe(canvasRef.current);
    window.addEventListener("resize", updateSize);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateSize);
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

  function focusNoteEditor(noteId: string) {
    const focusAttempt = () => {
      const textarea = document.querySelector(
        `textarea[data-note-id="${noteId}"]`,
      ) as HTMLTextAreaElement | null;
      if (!textarea) return false;
      textarea.focus({ preventScroll: true });
      const len = textarea.value.length;
      textarea.setSelectionRange(len, len);
      return true;
    };

    if (focusAttempt()) return;
    requestAnimationFrame(() => {
      if (focusAttempt()) return;
      requestAnimationFrame(() => {
        focusAttempt();
      });
    });
  }

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const typing = isTypingTarget(e.target);
      const createShortcut = (e.metaKey || e.ctrlKey) && !e.shiftKey && !e.altKey && e.key === "n";
      const allowWhileTyping = createShortcut || e.key === "Tab" || e.key === "Escape";
      if (typing && !allowWhileTyping) return;
      if ((e.metaKey || e.ctrlKey || e.altKey) && !createShortcut) return;

      const getNoteById = (id: string | null) => notes.find((n) => n.id === id) ?? null;
      const selected = getNoteById(selectedNoteId);

      const selectRelative = (delta: number) => {
        if (notes.length === 0) return;
        if (!selectedNoteId) {
          const firstId = notes[0].id;
          setSelectedNoteId(firstId);
          focusNoteEditor(firstId);
          return;
        }
        const idx = notes.findIndex((n) => n.id === selectedNoteId);
        if (idx === -1) {
          const firstId = notes[0].id;
          setSelectedNoteId(firstId);
          focusNoteEditor(firstId);
          return;
        }
        const nextIndex = (idx + delta + notes.length) % notes.length;
        const nextId = notes[nextIndex].id;
        setSelectedNoteId(nextId);
        focusNoteEditor(nextId);
      };

      const moveSelectedNote = (dx: number, dy: number) => {
        if (!selected) return;
        const nextX = selected.x + dx;
        const nextY = selected.y + dy;
        onMovePreview(selected.id, nextX, nextY);
        void onMoveCommit(selected.id, nextX, nextY);
      };

      const zoomAroundCenter = (nextScale: number) => {
        setViewport((prev) => {
          const clamped = Math.min(2, Math.max(0.5, nextScale));
          const centerX = canvasSize.width / 2;
          const centerY = canvasSize.height / 2;
          const worldX = (centerX - prev.x) / prev.scale;
          const worldY = (centerY - prev.y) / prev.scale;
          return {
            x: centerX - worldX * clamped,
            y: centerY - worldY * clamped,
            scale: clamped,
          };
        });
      };

      if (e.key === "Escape") {
        if (selectedNoteId) {
          e.preventDefault();
          setSelectedNoteId(null);
        }
        return;
      }

      if (e.key === "Tab") {
        e.preventDefault();
        selectRelative(e.shiftKey ? -1 : 1);
        return;
      }

      if (e.key === "Enter") {
        if (!selected) return;
        e.preventDefault();
        focusNoteEditor(selected.id);
        return;
      }

      if (createShortcut) {
        e.preventDefault();
        const worldCenterX = (canvasSize.width / 2 - viewport.x) / viewport.scale;
        const worldCenterY = (canvasSize.height / 2 - viewport.y) / viewport.scale;
        void (async () => {
          const created = await onCreateAt(worldCenterX - 140, worldCenterY - 90);
          setSelectedNoteId(created.id);
          focusNoteEditor(created.id);
        })();
        return;
      }

      if (e.key === "d" || e.key === "D") {
        if (!selected) return;
        e.preventDefault();
        void onToggleDone(selected.id);
        return;
      }

      if (e.key === "Delete" || e.key === "Backspace") {
        if (!selected) return;
        e.preventDefault();
        void onDelete(selected.id);
        setSelectedNoteId(null);
        return;
      }

      if (/^[1-6]$/.test(e.key)) {
        if (!selected) return;
        e.preventDefault();
        const color = NOTE_COLORS_ORDER[Number(e.key) - 1];
        void onColorChange(selected.id, color);
        return;
      }

      if (e.key === "+" || e.key === "=") {
        e.preventDefault();
        zoomAroundCenter(viewport.scale * 1.1);
        return;
      }

      if (e.key === "-" || e.key === "_") {
        e.preventDefault();
        zoomAroundCenter(viewport.scale / 1.1);
        return;
      }

      if (e.key === "0") {
        e.preventDefault();
        zoomAroundCenter(1);
        return;
      }

      if (e.key.startsWith("Arrow")) {
        e.preventDefault();
        const noteStep = e.shiftKey ? 60 : 18;
        const panStep = e.shiftKey ? 140 : 46;

        if (selected) {
          if (e.key === "ArrowUp") moveSelectedNote(0, -noteStep);
          if (e.key === "ArrowDown") moveSelectedNote(0, noteStep);
          if (e.key === "ArrowLeft") moveSelectedNote(-noteStep, 0);
          if (e.key === "ArrowRight") moveSelectedNote(noteStep, 0);
          return;
        }

        setViewport((prev) => ({
          ...prev,
          x:
            prev.x +
            (e.key === "ArrowLeft" ? panStep : e.key === "ArrowRight" ? -panStep : 0),
          y: prev.y + (e.key === "ArrowUp" ? panStep : e.key === "ArrowDown" ? -panStep : 0),
        }));
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    canvasSize.height,
    canvasSize.width,
    notes,
    onCreateAt,
    onColorChange,
    onDelete,
    onMoveCommit,
    onMovePreview,
    onToggleDone,
    selectedNoteId,
    viewport.scale,
    viewport.x,
    viewport.y,
  ]);

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

  const minimapData = useMemo(() => {
    const NOTE_WIDTH = 288;
    const NOTE_HEIGHT = 250;
    const PADDING = 180;
    const MINIMAP_WIDTH = 208;
    const MINIMAP_HEIGHT = 144;

    const viewportWorld: Rect = {
      x: -viewport.x / viewport.scale,
      y: -viewport.y / viewport.scale,
      width: canvasSize.width / viewport.scale,
      height: canvasSize.height / viewport.scale,
    };

    let minX = viewportWorld.x;
    let minY = viewportWorld.y;
    let maxX = viewportWorld.x + viewportWorld.width;
    let maxY = viewportWorld.y + viewportWorld.height;

    for (const note of notes) {
      minX = Math.min(minX, note.x);
      minY = Math.min(minY, note.y);
      maxX = Math.max(maxX, note.x + NOTE_WIDTH);
      maxY = Math.max(maxY, note.y + NOTE_HEIGHT);
    }

    minX -= PADDING;
    minY -= PADDING;
    maxX += PADDING;
    maxY += PADDING;

    const worldWidth = Math.max(maxX - minX, 1);
    const worldHeight = Math.max(maxY - minY, 1);
    const scale = Math.min(MINIMAP_WIDTH / worldWidth, MINIMAP_HEIGHT / worldHeight);
    const offsetX = (MINIMAP_WIDTH - worldWidth * scale) / 2;
    const offsetY = (MINIMAP_HEIGHT - worldHeight * scale) / 2;

    const worldToMinimap = (x: number, y: number) => ({
      x: (x - minX) * scale + offsetX,
      y: (y - minY) * scale + offsetY,
    });

    return {
      minimapWidth: MINIMAP_WIDTH,
      minimapHeight: MINIMAP_HEIGHT,
      viewportWorld,
      worldToMinimap,
      worldBounds: { minX, minY, maxX, maxY },
      notesScale: scale,
      viewportRect: (() => {
        const p = worldToMinimap(viewportWorld.x, viewportWorld.y);
        return {
          x: p.x,
          y: p.y,
          width: viewportWorld.width * scale,
          height: viewportWorld.height * scale,
        };
      })(),
    };
  }, [canvasSize.height, canvasSize.width, notes, viewport.scale, viewport.x, viewport.y]);

  function centerViewportAt(clientX: number, clientY: number) {
    const minimapEl = document.getElementById("scatter-minimap");
    if (!minimapEl) return;

    const rect = minimapEl.getBoundingClientRect();
    const localX = Math.max(0, Math.min(clientX - rect.left, minimapData.minimapWidth));
    const localY = Math.max(0, Math.min(clientY - rect.top, minimapData.minimapHeight));

    const contentWidth =
      (minimapData.worldBounds.maxX - minimapData.worldBounds.minX) * minimapData.notesScale;
    const contentHeight =
      (minimapData.worldBounds.maxY - minimapData.worldBounds.minY) * minimapData.notesScale;
    const contentOffsetX = (minimapData.minimapWidth - contentWidth) / 2;
    const contentOffsetY = (minimapData.minimapHeight - contentHeight) / 2;

    const worldX =
      (localX - contentOffsetX) / minimapData.notesScale + minimapData.worldBounds.minX;
    const worldY =
      (localY - contentOffsetY) / minimapData.notesScale + minimapData.worldBounds.minY;

    setViewport((prev) => ({
      ...prev,
      x: canvasSize.width / 2 - worldX * prev.scale,
      y: canvasSize.height / 2 - worldY * prev.scale,
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
          <div className="flex items-center">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md border border-zinc-600 bg-zinc-950 p-1">
                <Image
                  src="/scatter-logo.svg"
                  alt="Scatter logo"
                  width={20}
                  height={20}
                  className="[image-rendering:pixelated]"
                />
              </div>
              <span className="font-mono text-xs font-semibold uppercase tracking-[0.24em] text-zinc-100">
                Scatter Board
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedNote?.color ?? "offwhite"}
              disabled={!selectedNote}
              className="rounded-lg border border-zinc-700 bg-zinc-950 px-2.5 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-300 outline-none transition hover:border-zinc-500 disabled:cursor-not-allowed disabled:opacity-50"
              onChange={(e) => {
                if (!selectedNote) return;
                void onColorChange(selectedNote.id, e.target.value as NoteColor);
              }}
            >
              <option value="offwhite">Sand</option>
              <option value="gray">Cloud</option>
              <option value="olive">Leaf</option>
              <option value="bluegray">Sky</option>
              <option value="ashbrown">Rose</option>
              <option value="graphite">Iris</option>
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

        <div className="pointer-events-none fixed bottom-6 left-6 z-30 flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900/85 px-3 py-2 font-mono text-[11px] uppercase tracking-[0.16em] text-zinc-400 backdrop-blur">
          <span className="rounded-md border border-zinc-700 px-2 py-1">-</span>
          <span>{Math.round(viewport.scale * 100)}%</span>
          <span className="rounded-md border border-zinc-700 px-2 py-1">+</span>
          <span className="ml-2 hidden text-zinc-500 lg:inline">
            Cmd/Ctrl+N new | Tab cycle | 1-6 color | Arrows move
          </span>
        </div>

        <div className="fixed bottom-6 right-6 z-30 rounded-xl border border-zinc-700 bg-zinc-900/90 p-2 shadow-[0_10px_24px_rgba(0,0,0,0.55)] backdrop-blur">
          <div className="mb-1 flex items-center justify-between px-1 font-mono text-[9px] uppercase tracking-[0.16em] text-zinc-500">
            <span>Minimap</span>
            <span>{notes.length} notes</span>
          </div>
          <div
            id="scatter-minimap"
            className="relative overflow-hidden rounded-md border border-zinc-700/90 bg-zinc-950/95"
            style={{
              width: minimapData.minimapWidth,
              height: minimapData.minimapHeight,
            }}
            onPointerDown={(e) => {
              e.stopPropagation();
              centerViewportAt(e.clientX, e.clientY);
            }}
            onPointerMove={(e) => {
              if ((e.buttons & 1) === 0) return;
              e.stopPropagation();
              centerViewportAt(e.clientX, e.clientY);
            }}
          >
            {notes.map((note) => {
              const p = minimapData.worldToMinimap(note.x, note.y);
              const isSelected = selectedNoteId === note.id;
              return (
                <div
                  key={`mini-${note.id}`}
                  className={`absolute rounded-[2px] border ${
                    isSelected
                      ? "border-sky-300/95 bg-sky-200/65 shadow-[0_0_0_1px_rgba(186,230,253,0.4)]"
                      : "border-zinc-400/80 bg-zinc-300/40"
                  }`}
                  style={{
                    left: p.x,
                    top: p.y,
                    width: Math.max(4, 288 * minimapData.notesScale),
                    height: Math.max(3, 250 * minimapData.notesScale),
                  }}
                />
              );
            })}
            <div
              className="pointer-events-none absolute border border-white/90 bg-white/10"
              style={{
                left: minimapData.viewportRect.x,
                top: minimapData.viewportRect.y,
                width: minimapData.viewportRect.width,
                height: minimapData.viewportRect.height,
              }}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
