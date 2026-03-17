import type { CSSProperties } from "react";
import type { NoteColor, NoteRecord } from "@/lib/db/schema";

const NOTE_COLORS: Record<NoteColor, string> = {
  offwhite: "bg-amber-50 text-amber-950 border-amber-300",
  gray: "bg-zinc-100 text-zinc-900 border-zinc-300",
  olive: "bg-lime-100 text-lime-950 border-lime-300",
  bluegray: "bg-sky-100 text-sky-950 border-sky-300",
  ashbrown: "bg-rose-100 text-rose-950 border-rose-300",
  graphite: "bg-violet-100 text-violet-950 border-violet-300",
};

const NOTE_SELECTED_SHADE: Record<
  NoteColor,
  { borderColor: string; ringColor: string; shadowColor: string }
> = {
  offwhite: {
    borderColor: "#b45309",
    ringColor: "rgba(217, 119, 6, 0.35)",
    shadowColor: "rgba(217, 119, 6, 0.22)",
  },
  gray: {
    borderColor: "#52525b",
    ringColor: "rgba(113, 113, 122, 0.34)",
    shadowColor: "rgba(63, 63, 70, 0.2)",
  },
  olive: {
    borderColor: "#4d7c0f",
    ringColor: "rgba(101, 163, 13, 0.32)",
    shadowColor: "rgba(101, 163, 13, 0.2)",
  },
  bluegray: {
    borderColor: "#0369a1",
    ringColor: "rgba(14, 165, 233, 0.32)",
    shadowColor: "rgba(14, 165, 233, 0.2)",
  },
  ashbrown: {
    borderColor: "#be123c",
    ringColor: "rgba(244, 63, 94, 0.32)",
    shadowColor: "rgba(244, 63, 94, 0.2)",
  },
  graphite: {
    borderColor: "#7c3aed",
    ringColor: "rgba(139, 92, 246, 0.34)",
    shadowColor: "rgba(139, 92, 246, 0.22)",
  },
};

type Props = {
  note: NoteRecord;
  isSelected: boolean;
  onSelect: () => void;
  onStartDrag: (clientX: number, clientY: number) => void;
  onTextCommit: (text: string) => Promise<void>;
};

export function NoteCard({
  note,
  isSelected,
  onSelect,
  onStartDrag,
  onTextCommit,
}: Props) {
  function htmlToPlainText(input: string) {
    if (!input.includes("<")) return input;
    const el = document.createElement("div");
    el.innerHTML = input;
    return (el.textContent ?? "").trim();
  }

  const shade = NOTE_SELECTED_SHADE[note.color];
  const selectedStyle = isSelected
    ? ({
        borderColor: shade.borderColor,
        boxShadow: `0 0 0 2px ${shade.ringColor}, 0 12px 22px ${shade.shadowColor}`,
      } as CSSProperties)
    : undefined;

  return (
    <article
      className={`absolute relative w-72 rounded-2xl border p-4 shadow-sm transition ${
        isSelected
          ? "z-10"
          : "hover:border-zinc-500/60"
      } ${NOTE_COLORS[note.color]}`}
      style={{
        left: note.x,
        top: note.y,
        ...selectedStyle,
      }}
      onPointerDown={(e) => {
        e.stopPropagation();
        onSelect();
        const target = e.target as HTMLElement;
        if (target.closest("[data-no-drag='true']")) return;
        onStartDrag(e.clientX, e.clientY);
      }}
    >
      <div className="mb-3 flex items-center justify-between gap-2 border-b border-current/25 pb-2">
        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-current/70">
          {note.done ? "Done" : isSelected ? "Selected" : "Draft"}
        </span>
        {note.done && (
          <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-current/70">
            Completed
          </span>
        )}
      </div>

      <textarea
        data-no-drag="true"
        data-note-id={note.id}
        className={`min-h-28 w-full resize-none bg-transparent p-0 font-[family-name:var(--font-handwritten)] text-[26px] leading-8 text-current outline-none placeholder:text-current/45 ${
          note.done ? "line-through opacity-70" : ""
        }`}
        defaultValue={htmlToPlainText(note.text)}
        placeholder="write your note..."
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
        onFocus={() => onSelect()}
        onBlur={(e) => void onTextCommit(e.currentTarget.value)}
      />

      <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.2em] text-current/65">
        updated just now
      </p>
    </article>
  );
}
