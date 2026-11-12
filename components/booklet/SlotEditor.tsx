import { KeyboardEvent, PointerEvent, useRef, useState } from "react";
import { Trash2 } from "lucide-react";
import { cn } from "../../lib/utils";
import { MAX_SLOTS_PER_PAGE, PAGE_ASPECT, normalizeSlot, type Orientation, type Slot } from "../../lib/booklets";

type SlotEditorProps = {
  orientation: Orientation;
  sketchUrl: string;
  slots: Slot[];
  onChange: (slots: Slot[]) => void;
};

type Drag =
  | { kind: "move"; index: number; startX: number; startY: number; origin: Slot }
  | { kind: "resize"; index: number; startX: number; startY: number; origin: Slot }
  | { kind: "draw"; startX: number; startY: number };

const NUDGE = 0.01;

/**
 * Photo-slot editor drawn over George's sketch.
 * Drag on empty paper to draw a slot · drag a slot to move · drag its corner to resize ·
 * arrow keys nudge (Shift = resize) · Delete removes.
 */
export function SlotEditor({ orientation, sketchUrl, slots, onChange }: SlotEditorProps) {
  const pageRef = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [drag, setDrag] = useState<Drag | null>(null);
  const [draft, setDraft] = useState<Slot | null>(null);

  const point = (event: PointerEvent) => {
    const rect = pageRef.current!.getBoundingClientRect();
    return { x: (event.clientX - rect.left) / rect.width, y: (event.clientY - rect.top) / rect.height };
  };

  const update = (index: number, slot: Slot) => onChange(slots.map((item, i) => (i === index ? normalizeSlot(slot) : item)));

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    const target = event.target as HTMLElement;
    const index = target.closest<HTMLElement>("[data-slot]")?.dataset.slot;
    const { x, y } = point(event);
    pageRef.current?.setPointerCapture(event.pointerId);
    if (index !== undefined) {
      const i = Number(index);
      setSelected(i);
      setDrag({ kind: target.dataset.handle ? "resize" : "move", index: i, startX: x, startY: y, origin: slots[i] });
    } else if (slots.length < MAX_SLOTS_PER_PAGE) {
      setSelected(null);
      setDrag({ kind: "draw", startX: x, startY: y });
    }
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!drag) return;
    const { x, y } = point(event);
    const dx = x - drag.startX;
    const dy = y - drag.startY;
    if (drag.kind === "move") update(drag.index, { ...drag.origin, x: drag.origin.x + dx, y: drag.origin.y + dy });
    else if (drag.kind === "resize") update(drag.index, { ...drag.origin, w: drag.origin.w + dx, h: drag.origin.h + dy });
    else
      setDraft({
        x: Math.min(x, drag.startX),
        y: Math.min(y, drag.startY),
        w: Math.abs(dx),
        h: Math.abs(dy),
      });
  };

  const onPointerUp = () => {
    if (drag?.kind === "draw" && draft && draft.w > 0.03 && draft.h > 0.03) {
      onChange([...slots, normalizeSlot(draft)]);
      setSelected(slots.length);
    }
    setDrag(null);
    setDraft(null);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (selected === null || !slots[selected]) return;
    const slot = slots[selected];
    if (event.key === "Delete" || event.key === "Backspace") {
      event.preventDefault();
      onChange(slots.filter((_, i) => i !== selected));
      setSelected(null);
      return;
    }
    const step = { ArrowLeft: [-NUDGE, 0], ArrowRight: [NUDGE, 0], ArrowUp: [0, -NUDGE], ArrowDown: [0, NUDGE] }[event.key];
    if (!step) return;
    event.preventDefault();
    update(
      selected,
      event.shiftKey ? { ...slot, w: slot.w + step[0], h: slot.h + step[1] } : { ...slot, x: slot.x + step[0], y: slot.y + step[1] },
    );
  };

  return (
    <div className="space-y-3">
      <div
        ref={pageRef}
        tabIndex={0}
        role="application"
        aria-label="Page layout editor. Drag on the page to add a photo slot."
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={onKeyDown}
        className="relative mx-auto w-full max-w-[560px] cursor-crosshair touch-none select-none overflow-hidden bg-white outline-none ring-offset-2 ring-offset-background focus-visible:ring-2 focus-visible:ring-brand-red"
        style={{ aspectRatio: String(PAGE_ASPECT[orientation]) }}
      >
        <img src={sketchUrl} alt="Your sketch" draggable={false} className="pointer-events-none absolute inset-0 h-full w-full object-fill opacity-70" />
        {slots.map((slot, i) => (
          <div
            key={i}
            data-slot={i}
            className={cn(
              "absolute cursor-move border-2 bg-brand-red/15 transition-colors",
              selected === i ? "border-brand-red bg-brand-red/25" : "border-brand-red/60 hover:bg-brand-red/20",
            )}
            style={{ left: `${slot.x * 100}%`, top: `${slot.y * 100}%`, width: `${slot.w * 100}%`, height: `${slot.h * 100}%` }}
          >
            <span className="pointer-events-none absolute left-1 top-1 rounded bg-brand-red px-1.5 text-[11px] font-semibold text-white">{i + 1}</span>
            <span
              data-handle="resize"
              aria-hidden="true"
              className="absolute -bottom-1.5 -right-1.5 h-4 w-4 cursor-nwse-resize rounded-full border-2 border-white bg-brand-red"
            />
          </div>
        ))}
        {draft && (
          <div
            className="pointer-events-none absolute border-2 border-dashed border-brand-red bg-brand-red/10"
            style={{ left: `${draft.x * 100}%`, top: `${draft.y * 100}%`, width: `${draft.w * 100}%`, height: `${draft.h * 100}%` }}
          />
        )}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
        <span>
          {slots.length} photo{slots.length === 1 ? "" : "s"} · drag on the page to add · arrows nudge, Shift+arrows resize
        </span>
        {selected !== null && slots[selected] && (
          <button
            type="button"
            onClick={() => {
              onChange(slots.filter((_, i) => i !== selected));
              setSelected(null);
            }}
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line px-3 text-zinc-200 hover:border-brand-red/60"
          >
            <Trash2 size={14} /> Remove slot {selected + 1}
          </button>
        )}
      </div>
    </div>
  );
}
