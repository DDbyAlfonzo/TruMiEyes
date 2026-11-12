import { useEffect, useRef, useState } from "react";
import { Check, ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "../../lib/utils";
import type { Orientation, Slot } from "../../lib/booklets";
import { BookletPage } from "./BookletPage";

type BookletPreviewProps = {
  name: string;
  description: string | null;
  orientation: Orientation;
  pages: { sketchUrl: string; slots: Slot[] }[];
  /** Client's favourites, in order — they flow into the slots page by page. */
  photos: string[];
  selected: boolean;
  locked: boolean;
  studioName: string;
  onChoose: () => void;
  onClose: () => void;
};

/** Flip through a booklet with the client's own favourites placed in George's layout. */
export function BookletPreview({
  name,
  description,
  orientation,
  pages,
  photos,
  selected,
  locked,
  studioName,
  onChoose,
  onClose,
}: BookletPreviewProps) {
  const ref = useRef<HTMLDivElement>(null);
  const touchX = useRef<number | null>(null);
  const [page, setPage] = useState(0);
  const [showSketch, setShowSketch] = useState(false);
  const [wide, setWide] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(min-width: 640px)");
    const sync = () => setWide(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);
  // Portrait/square pages show as a two-page spread on wider screens.
  const spread = orientation !== "LANDSCAPE" && wide;
  const step = spread ? 2 : 1;

  // Assign favourites to slots across the whole booklet.
  const offsets = pages.reduce<number[]>((acc, p, i) => [...acc, i === 0 ? 0 : acc[i - 1] + pages[i - 1].slots.length], []);
  const capacity = pages.reduce((total, p) => total + p.slots.length, 0);
  const visible = pages.slice(page, page + step);
  const go = (delta: number) => setPage((value) => Math.min(Math.max(0, value + delta * step), Math.max(0, pages.length - 1)));

  useEffect(() => {
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    ref.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
      } else if (event.key === "ArrowRight") go(1);
      else if (event.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey, true);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener("keydown", onKey, true);
    };
  });

  return (
    <div
      ref={ref}
      role="dialog"
      aria-modal="true"
      aria-label={`${name} booklet preview`}
      tabIndex={-1}
      className="fixed inset-0 z-[60] flex flex-col bg-[#ECEAE5] text-trumi-ink outline-none"
    >
      <header className="flex h-16 shrink-0 items-center justify-between gap-3 px-4 md:px-8">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-11 items-center gap-2 rounded-full px-3 text-sm hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-trumi-red/40"
        >
          <X size={18} /> <span className="hidden sm:inline">Close</span>
        </button>
        <div className="min-w-0 text-center">
          <p className="truncate text-sm font-semibold">{name}</p>
          <p className="truncate text-xs text-ink-soft">
            {capacity} photos · {pages.length} pages{description ? ` · ${description}` : ""}
          </p>
        </div>
        <label className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-full px-3 text-xs text-ink-soft hover:bg-black/5">
          <input type="checkbox" checked={showSketch} onChange={(event) => setShowSketch(event.target.checked)} className="accent-trumi-red" />
          <span className="hidden sm:inline">{studioName.charAt(0).toUpperCase() + studioName.slice(1)}&apos;s sketch</span>
          <span className="sm:hidden">Sketch</span>
        </label>
      </header>

      <div
        className="relative flex min-h-0 flex-1 items-center justify-center px-4 md:px-24"
        onTouchStart={(event) => {
          touchX.current = event.touches[0]?.clientX ?? null;
        }}
        onTouchEnd={(event) => {
          if (touchX.current === null) return;
          const delta = event.changedTouches[0].clientX - touchX.current;
          touchX.current = null;
          if (Math.abs(delta) > 45) go(delta > 0 ? -1 : 1);
        }}
      >
        <button
          type="button"
          onClick={() => go(-1)}
          disabled={page === 0}
          aria-label="Previous pages"
          className="absolute left-4 top-1/2 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow disabled:opacity-30 md:inline-flex"
        >
          <ChevronLeft size={20} />
        </button>
        <div
          key={page}
          className={cn("flex h-full max-h-[68vh] w-full items-center justify-center gap-0 animate-tile-in", spread ? "max-w-4xl" : "max-w-3xl")}
        >
          {visible.map((item, i) => (
            <div key={page + i} className={cn("w-full", spread && "w-1/2")}>
              <BookletPage
                orientation={orientation}
                slots={item.slots}
                photos={photos.slice(offsets[page + i], offsets[page + i] + item.slots.length)}
                sketchUrl={item.sketchUrl}
                showSketch={showSketch}
                label={`Page ${page + i + 1}`}
              />
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => go(1)}
          disabled={page + step >= pages.length}
          aria-label="Next pages"
          className="absolute right-4 top-1/2 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow disabled:opacity-30 md:inline-flex"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      <footer className="flex shrink-0 flex-col items-center gap-3 px-4 pb-safe pt-4 md:pb-8">
        <p className="text-xs text-ink-soft" aria-live="polite">
          Page {page + 1}
          {spread && visible.length > 1 ? `–${page + 2}` : ""} of {pages.length}
          {photos.length < capacity ? ` · ${capacity - photos.length} spaces left for favourites` : ""}
        </p>
        {!locked && (
          <button
            type="button"
            onClick={onChoose}
            className={cn(
              "inline-flex h-12 min-w-[240px] items-center justify-center gap-2 rounded-full px-6 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-trumi-red/40",
              selected ? "bg-trumi-ink text-white" : "bg-trumi-red text-white hover:bg-trumi-red-deep",
            )}
          >
            {selected ? (
              <>
                <Check size={16} /> Your booklet
              </>
            ) : (
              "Choose this booklet"
            )}
          </button>
        )}
      </footer>
    </div>
  );
}
