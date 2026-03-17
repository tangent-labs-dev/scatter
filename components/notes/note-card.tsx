import type { NoteColor, NoteRecord } from "@/lib/db/schema";

const NOTE_COLORS: Record<NoteColor, string> = {
  offwhite: "bg-amber-50 text-amber-950 border-amber-300",
  gray: "bg-zinc-100 text-zinc-900 border-zinc-300",
  olive: "bg-lime-100 text-lime-950 border-lime-300",
  bluegray: "bg-sky-100 text-sky-950 border-sky-300",
  ashbrown: "bg-rose-100 text-rose-950 border-rose-300",
  graphite: "bg-violet-100 text-violet-950 border-violet-300",
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

  return (
    <article
      className={`absolute w-72 rounded-2xl border p-4 shadow-sm transition ${
        isSelected
          ? "ring-2 ring-zinc-500/50"
          : "hover:border-zinc-500/60"
      } ${NOTE_COLORS[note.color]}`}
      style={{
        left: note.x,
        top: note.y,
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
          {note.done ? "Done" : isSelected ? "Editing" : "Draft"}
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
