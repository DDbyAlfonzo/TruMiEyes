import { useEffect, useRef } from "react";
import { ArrowLeft, Check, Lock } from "lucide-react";
import { cn } from "../../lib/utils";
import { SelectionProgress } from "./SelectionProgress";
import type { GalleryLayout, GalleryPhoto } from "./types";

type ReviewSheetProps = {
  layouts: GalleryLayout[];
  selectedLayoutId: string;
  favourites: GalleryPhoto[];
  notes: string;
  locked: boolean;
  submitting: boolean;
  submitted: boolean;
  target?: number | null;
  studioName?: string;
  onSelectLayout: (layoutId: string) => void;
  onNotesChange: (notes: string) => void;
  onSubmit: () => void;
  onClose: () => void;
};

const PREVIEW_LIMIT = 11;

export function ReviewSheet({
  layouts,
  selectedLayoutId,
  favourites,
  notes,
  locked,
  submitting,
  submitted,
  target,
  studioName = "George",
  onSelectLayout,
  onNotesChange,
  onSubmit,
  onClose,
}: ReviewSheetProps) {
  const ref = useRef<HTMLDivElement>(null);
  const selectedLayout = layouts.find((layout) => layout.id === selectedLayoutId);
  const needsLayout = layouts.length > 0 && !selectedLayout;
  const canSubmit = !locked && !submitting && favourites.length > 0 && !needsLayout;

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    ref.current?.focus();
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener("keydown", onKey);
      previouslyFocused?.focus?.();
    };
  }, [onClose]);

  const steps = [
    { title: "You send your selection", body: "Your favourites are saved and locked in." },
    { title: `${studioName} designs your book`, body: "You'll hear from the studio if anything needs a tweak." },
    { title: "Approve and print", body: "One final look, then it's off to print." },
  ];

  return (
    <div
      ref={ref}
      role="dialog"
      aria-modal="true"
      aria-labelledby="review-title"
      tabIndex={-1}
      className="gallery-theme fixed inset-0 z-50 flex flex-col overflow-y-auto outline-none lg:overflow-hidden"
    >
      <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between border-b border-hairline bg-paper/95 px-4 backdrop-blur md:px-10">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-11 items-center gap-2 rounded-full px-2 text-sm text-trumi-ink hover:text-trumi-red focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-trumi-red/40"
        >
          <ArrowLeft size={18} /> {locked ? "Back to gallery" : "Keep choosing"}
        </button>
        <img src="/brand/wordmark.svg" alt="TruMiEyes" className="h-3 w-auto" />
        <span className="w-24" aria-hidden="true" />
      </header>

      <div className="grid flex-1 lg:min-h-0 lg:grid-cols-[minmax(0,1fr)_420px]">
        <main className="space-y-10 px-4 py-8 md:px-12 md:py-10 lg:overflow-y-auto">
          <div className="space-y-2">
            <p className="text-[11px] uppercase tracking-brand text-ink-soft">{locked ? "Your selection" : "Last step"}</p>
            <h1 id="review-title" className="font-display text-4xl font-extralight leading-none text-trumi-ink md:text-6xl">
              Your photo book
            </h1>
          </div>

          {layouts.length > 0 && (
            <section aria-labelledby="layout-heading" className="space-y-4">
              <h2 id="layout-heading" className="text-sm font-semibold text-trumi-ink">
                Choose a layout
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {layouts.map((layout) => {
                  const active = layout.id === selectedLayoutId;
                  return (
                    <button
                      key={layout.id}
                      type="button"
                      disabled={locked}
                      aria-pressed={active}
                      onClick={() => onSelectLayout(layout.id)}
                      className={cn(
                        "flex flex-col gap-3 rounded-xl border bg-white p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-trumi-red/40 disabled:cursor-default",
                        active ? "border-trumi-ink shadow-[0_0_0_1px_#231F20]" : "border-hairline hover:border-trumi-ink/50",
                      )}
                    >
                      <img src={layout.previewImageUrl} alt="" className="aspect-[4/3] w-full rounded-md bg-stone object-cover" />
                      <span className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-trumi-ink">{layout.name}</span>
                        {active && (
                          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-trumi-ink text-white">
                            <Check size={12} strokeWidth={3} />
                          </span>
                        )}
                      </span>
                      <span className="text-[13px] text-ink-soft">
                        {layout.pageCount} photos{layout.description ? ` · ${layout.description}` : ""}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          <section aria-labelledby="favs-heading" className="space-y-4">
            <div className="flex items-baseline justify-between gap-4">
              <h2 id="favs-heading" className="text-sm font-semibold text-trumi-ink">
                Your favourites
              </h2>
              {!locked && (
                <button type="button" onClick={onClose} className="text-[13px] text-trumi-ink underline-offset-4 hover:underline">
                  Edit in gallery
                </button>
              )}
            </div>
            <SelectionProgress count={favourites.length} target={target} className="max-w-sm" />
            {favourites.length === 0 ? (
              <p className="rounded-xl border border-dashed border-hairline p-6 text-sm text-ink-soft">
                Tap the heart on the photos you love and they'll appear here.
              </p>
            ) : (
              <ul className="grid grid-cols-4 gap-1.5 sm:grid-cols-6 xl:grid-cols-12">
                {favourites.slice(0, PREVIEW_LIMIT).map((photo) => (
                  <li key={photo.id}>
                    <img src={photo.thumbUrl} alt={photo.filename} className="aspect-square w-full rounded bg-stone object-cover" loading="lazy" />
                  </li>
                ))}
                {favourites.length > PREVIEW_LIMIT && (
                  <li className="flex aspect-square items-center justify-center rounded bg-trumi-ink text-sm font-semibold text-white">
                    +{favourites.length - PREVIEW_LIMIT}
                  </li>
                )}
              </ul>
            )}
          </section>
        </main>

        <aside className="flex flex-col gap-8 border-t border-hairline bg-white px-4 py-8 md:px-10 lg:border-l lg:border-t-0 lg:py-10">
          <div className="space-y-2.5">
            <label htmlFor="selection-notes" className="text-sm font-semibold text-trumi-ink">
              Notes for {studioName}
            </label>
            <textarea
              id="selection-notes"
              rows={5}
              value={notes}
              disabled={locked}
              onChange={(event) => onNotesChange(event.target.value)}
              placeholder="Anything about retouching, the cover photo or delivery"
              className="w-full resize-none rounded-xl border border-hairline bg-paper p-3.5 text-sm leading-6 text-trumi-ink placeholder:text-ink-soft/80 focus:border-trumi-ink focus:outline-none disabled:opacity-70"
            />
          </div>

          <div className="space-y-4">
            <p className="text-sm font-semibold text-trumi-ink">What happens next</p>
            <ol className="space-y-4">
              {steps.map((step, i) => {
                const done = submitted ? i === 0 : false;
                return (
                  <li key={step.title} className="flex gap-3">
                    <span
                      className={cn(
                        "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs",
                        done || (!submitted && i === 0) ? "bg-trumi-ink text-white" : "border border-hairline text-ink-soft",
                      )}
                    >
                      {done ? <Check size={12} strokeWidth={3} /> : i + 1}
                    </span>
                    <span className="text-sm leading-6">
                      <span className="font-semibold text-trumi-ink">{step.title}</span>
                      <br />
                      <span className="text-ink-soft">{step.body}</span>
                    </span>
                  </li>
                );
              })}
            </ol>
          </div>

          <div className="mt-auto space-y-2.5 pb-safe">
            {locked ? (
              <p className="flex items-center justify-center gap-2 rounded-full bg-stone px-4 py-3.5 text-sm text-trumi-ink">
                <Lock size={15} /> Sent to {studioName}. Your selection is locked.
              </p>
            ) : (
              <button
                type="button"
                onClick={onSubmit}
                disabled={!canSubmit}
                className="inline-flex h-13 min-h-[52px] w-full items-center justify-center rounded-full bg-trumi-red text-[15px] font-semibold text-white transition hover:bg-trumi-red-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-trumi-red/40 focus-visible:ring-offset-2 disabled:opacity-45"
              >
                {submitting ? "Sending…" : `Send selection to ${studioName}`}
              </button>
            )}
            <p className="text-center text-xs text-ink-soft">
              {needsLayout
                ? "Choose a layout to continue"
                : favourites.length === 0
                  ? "Add at least one favourite to continue"
                  : `${selectedLayout ? `${selectedLayout.name} · ` : ""}${favourites.length} photos`}
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
