import type { NoteColor, NoteRecord } from "@/lib/db/schema";

const NOTE_COLORS: Record<NoteColor, string> = {
  offwhite:
    "bg-zinc-950 text-emerald-300 border-emerald-500/45 shadow-[inset_0_0_28px_rgba(16,185,129,0.12)]",
  gray: "bg-zinc-950 text-lime-300 border-lime-500/45 shadow-[inset_0_0_28px_rgba(132,204,22,0.12)]",
  olive:
    "bg-zinc-950 text-green-300 border-green-500/45 shadow-[inset_0_0_28px_rgba(34,197,94,0.12)]",
  bluegray:
    "bg-zinc-950 text-cyan-300 border-cyan-500/45 shadow-[inset_0_0_28px_rgba(34,211,238,0.12)]",
  ashbrown:
    "bg-zinc-950 text-yellow-300 border-yellow-500/45 shadow-[inset_0_0_28px_rgba(234,179,8,0.11)]",
  graphite:
    "bg-zinc-950 text-teal-300 border-teal-500/45 shadow-[inset_0_0_28px_rgba(45,212,191,0.12)]",
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
  return (
    <article
      className={`matrix-note absolute w-72 rounded-2xl border p-4 shadow-[0_18px_40px_rgba(0,0,0,0.45)] transition ${
        isSelected
          ? "scale-[1.01] ring-2 ring-emerald-400/70 shadow-[0_0_0_1px_rgba(16,185,129,0.35),0_24px_46px_rgba(0,0,0,0.62)]"
          : "hover:border-emerald-300/60"
      } ${NOTE_COLORS[note.color]}`}
      style={{
        left: note.x,
        top: note.y,
      }}
      onPointerDown={(e) => {
        e.stopPropagation();
        onSelect();
        onStartDrag(e.clientX, e.clientY);
      }}
    >
      <div className="mb-3 flex items-center justify-between gap-2 border-b border-current/25 pb-2">
        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-current/70">
          {note.done ? "Done" : isSelected ? "Editing" : "Draft"}
        </span>
        {note.done && (
          <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-current/70">
            Completed
          </span>
        )}
      </div>

      <textarea
        className={`min-h-28 w-full resize-none bg-transparent p-0 font-[family-name:var(--font-handwritten)] text-[26px] leading-8 text-current [text-shadow:0_0_10px_rgba(110,231,183,0.25)] outline-none placeholder:text-current/35 ${
          note.done ? "line-through opacity-70" : ""
        }`}
        defaultValue={note.text}
        placeholder="write your signal..."
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
