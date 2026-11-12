import { ArrowRight } from "lucide-react";
import { cn } from "../../lib/utils";
import { SelectionProgress } from "./SelectionProgress";
import type { GalleryFilter } from "./types";

type GalleryToolbarProps = {
  filter: GalleryFilter;
  counts: Record<GalleryFilter, number>;
  favouriteCount: number;
  target?: number | null;
  bookletName?: string | null;
  locked: boolean;
  onFilterChange: (filter: GalleryFilter) => void;
  onReview: () => void;
};

const FILTERS: { id: GalleryFilter; label: string }[] = [
  { id: "all", label: "All photos" },
  { id: "favourites", label: "Favourites" },
  { id: "labelled", label: "Labelled" },
  { id: "comments", label: "Comments" },
];

export function GalleryToolbar({
  filter,
  counts,
  favouriteCount,
  target,
  bookletName,
  locked,
  onFilterChange,
  onReview,
}: GalleryToolbarProps) {
  return (
    <div id="photos" className="sticky top-16 z-30 border-b border-hairline bg-paper/90 backdrop-blur-xl supports-[backdrop-filter]:bg-paper/80">
      <div className="mx-auto flex max-w-[1360px] items-center justify-between gap-4 px-4 py-3 md:px-10">
        <div role="tablist" aria-label="Filter photos" className="-mx-1 flex min-w-0 gap-1.5 overflow-x-auto px-1 [scrollbar-width:none]">
          {FILTERS.map((item) => {
            const active = filter === item.id;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onFilterChange(item.id)}
                className={cn(
                  "inline-flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 text-[13px] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-trumi-red/40",
                  active
                    ? "border-trumi-ink bg-trumi-ink text-white"
                    : "border-hairline text-trumi-ink hover:border-trumi-ink",
                )}
              >
                {item.label}
                <span className={cn("tabular-nums", active ? "text-white/70" : "text-ink-soft")}>{counts[item.id]}</span>
              </button>
            );
          })}
        </div>

        <div className="hidden shrink-0 items-center gap-5 md:flex">
          <SelectionProgress count={favouriteCount} target={target} bookletName={bookletName} className="w-60" />
          <button
            type="button"
            onClick={onReview}
            className="inline-flex h-10 items-center gap-2 rounded-full bg-trumi-ink px-5 text-[13px] font-semibold text-white transition hover:bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-trumi-red/50"
          >
            {locked ? "View selection" : "Review selection"}
            <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}

/** Floating selection bar for phones (the toolbar's progress + CTA move here). */
export function MobileSelectionBar({
  favouriteCount,
  target,
  locked,
  onReview,
  bookletName,
}: Pick<GalleryToolbarProps, "favouriteCount" | "target" | "bookletName" | "locked" | "onReview">) {
  return (
    <div className="fixed inset-x-3 bottom-0 z-30 pb-safe md:hidden">
      <div className="flex items-center gap-3 rounded-full bg-trumi-ink py-2 pl-5 pr-2 text-white shadow-[0_14px_36px_rgba(35,31,32,0.35)]">
        <SelectionProgress count={favouriteCount} target={target} bookletName={bookletName} tone="dark" className="min-w-0 flex-1" />
        <button
          type="button"
          onClick={onReview}
          className="inline-flex h-11 shrink-0 items-center rounded-full bg-white px-5 text-[13px] font-semibold text-trumi-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-trumi-red"
        >
          {locked ? "View" : "Review"}
        </button>
      </div>
    </div>
  );
}
