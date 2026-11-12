import { FormEvent, useEffect, useRef, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight, Download, X } from "lucide-react";
import { cn } from "../../lib/utils";
import { LABELS, type LabelColor } from "../../lib/labels";
import { HeartIcon } from "./icons";
import type { GalleryPhoto, PhotoState } from "./types";

type ProofingLightboxProps = {
  photos: GalleryPhoto[];
  states: Record<string, PhotoState>;
  index: number;
  locked: boolean;
  studioName?: string;
  onIndexChange: (index: number) => void;
  onClose: () => void;
  onToggleFavourite: (photoId: string) => void;
  onSetLabel: (photoId: string, color: LabelColor | null) => void;
  onAddComment: (photoId: string, message: string) => Promise<boolean>;
};

const isTypingTarget = (target: EventTarget | null) =>
  target instanceof HTMLElement && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));

export function ProofingLightbox({
  photos,
  states,
  index,
  locked,
  studioName = "George",
  onIndexChange,
  onClose,
  onToggleFavourite,
  onSetLabel,
  onAddComment,
}: ProofingLightboxProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  const photo = photos[index];
  const state = photo ? states[photo.id] : undefined;
  const total = photos.length;
  const go = (delta: number) => onIndexChange((index + delta + total) % total);

  // Focus the dialog, lock page scroll, restore focus on close.
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();
    return () => {
      document.body.style.overflow = overflow;
      previouslyFocused?.focus?.();
    };
  }, []);

  useEffect(() => setDraft(""), [photo?.id]);

  // Preload neighbours so browsing feels instant.
  useEffect(() => {
    [photos[(index + 1) % total], photos[(index - 1 + total) % total]].forEach((item) => {
      if (item) new Image().src = item.imageUrl;
    });
  }, [index, photos, total]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") return onClose();
      if (isTypingTarget(event.target) || event.metaKey || event.ctrlKey || event.altKey || !photo) return;
      if (event.key === "ArrowRight") go(1);
      else if (event.key === "ArrowLeft") go(-1);
      else if (!locked && event.key.toLowerCase() === "f") onToggleFavourite(photo.id);
      else if (!locked) {
        const label = LABELS.find((item) => item.shortcut === event.key);
        if (label) onSetLabel(photo.id, state?.label === label.color ? null : label.color);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (!photo || !state) return null;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const message = draft.trim();
    if (!message || sending) return;
    setSending(true);
    const ok = await onAddComment(photo.id, message);
    setSending(false);
    if (ok) setDraft("");
  };

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={`Photo ${index + 1} of ${total}: ${photo.filename}`}
      tabIndex={-1}
      className="fixed inset-0 z-50 flex flex-col bg-trumi-ink text-[#F4F2EE] outline-none lg:flex-row"
    >
      <section className="flex min-h-0 flex-1 flex-col">
        <div className="flex h-16 shrink-0 items-center justify-between gap-3 px-3 md:px-6">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 items-center gap-2 rounded-full px-3 text-sm hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
          >
            <X size={18} />
            <span className="hidden sm:inline">Back to gallery</span>
          </button>
          <span className="min-w-0 truncate text-[13px] text-white/65">
            {photo.filename} · {index + 1} of {total}
          </span>
          {photo.downloadable ? (
            <a
              href={photo.downloadUrl}
              download={photo.filename}
              className="inline-flex h-11 items-center gap-2 rounded-full border border-white/20 px-4 text-sm hover:border-white/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            >
              <Download size={16} />
              <span className="hidden sm:inline">Download</span>
            </a>
          ) : (
            <span className="w-11" />
          )}
        </div>

        <div
          className="relative flex min-h-0 flex-1 items-center justify-center px-3 pb-3 md:px-20"
          onTouchStart={(event) => {
            touchStartX.current = event.touches[0]?.clientX ?? null;
          }}
          onTouchEnd={(event) => {
            if (touchStartX.current === null) return;
            const delta = event.changedTouches[0].clientX - touchStartX.current;
            touchStartX.current = null;
            if (Math.abs(delta) > 45) go(delta > 0 ? -1 : 1);
          }}
        >
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Previous photo"
            className="absolute left-5 top-1/2 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-white/5 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 md:inline-flex"
          >
            <ChevronLeft size={20} />
          </button>
          <img
            key={photo.id}
            src={photo.imageUrl}
            alt={photo.filename}
            className="max-h-full max-w-full object-contain shadow-[0_30px_80px_rgba(0,0,0,0.45)] animate-tile-in"
          />
          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Next photo"
            className="absolute right-5 top-1/2 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-white/5 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 md:inline-flex"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        <div className="hidden h-24 shrink-0 items-center justify-center gap-2 overflow-hidden px-6 pb-4 md:flex">
          {photos.slice(Math.max(0, index - 4), index + 5).map((item) => {
            const itemIndex = photos.indexOf(item);
            const current = itemIndex === index;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onIndexChange(itemIndex)}
                aria-label={`Show ${item.filename}`}
                aria-current={current}
                className={cn(
                  "h-16 w-16 shrink-0 overflow-hidden rounded transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white",
                  current ? "ring-2 ring-white ring-offset-2 ring-offset-trumi-ink" : "opacity-45 hover:opacity-80",
                )}
              >
                <img src={item.thumbUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
              </button>
            );
          })}
        </div>
      </section>

      <aside
        aria-label="Photo details"
        className="flex max-h-[46vh] shrink-0 flex-col border-t border-trumi-charcoal bg-[#2B2728] lg:max-h-none lg:w-[360px] lg:border-l lg:border-t-0"
      >
        <div className="space-y-5 border-b border-trumi-charcoal p-5 lg:p-6">
          <button
            type="button"
            onClick={() => onToggleFavourite(photo.id)}
            disabled={locked}
            aria-pressed={state.favourite}
            className={cn(
              "inline-flex h-12 w-full items-center justify-center gap-2.5 rounded-full text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 disabled:opacity-60",
              state.favourite ? "bg-trumi-red text-white" : "border border-white/25 hover:border-white/60",
            )}
          >
            <HeartIcon filled={state.favourite} className={cn("h-[18px] w-[18px]", state.favourite && "animate-heart-pop")} />
            {state.favourite ? "In your favourites" : "Add to favourites"}
          </button>

          <fieldset disabled={locked} className="space-y-2.5">
            <legend className="mb-2.5 text-[11px] uppercase tracking-[0.16em] text-white/60">Label for {studioName}</legend>
            <div className="flex flex-wrap gap-2">
              {LABELS.map((label) => {
                const active = state.label === label.color;
                return (
                  <button
                    key={label.color}
                    type="button"
                    aria-pressed={active}
                    onClick={() => onSetLabel(photo.id, active ? null : label.color)}
                    className={cn(
                      "inline-flex h-9 items-center gap-2 rounded-full border px-3 text-[13px] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 disabled:opacity-60",
                      active ? "border-white bg-white/10" : "border-white/20 hover:border-white/50",
                    )}
                  >
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: label.swatch }} />
                    {label.name}
                  </button>
                );
              })}
            </div>
          </fieldset>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5 lg:p-6">
          <p className="text-[11px] uppercase tracking-[0.16em] text-white/60">Notes · {state.comments.length}</p>
          {state.comments.length === 0 && (
            <p className="text-sm leading-6 text-white/65">Anything {studioName} should know about this photo? Add a note below.</p>
          )}
          {state.comments.map((comment) => (
            <div key={comment.id} className="space-y-1">
              <p className="text-xs text-white/55">{new Date(comment.createdAt).toLocaleString()}</p>
              <p className="text-sm leading-6 text-white/90">{comment.message}</p>
            </div>
          ))}
        </div>

        <form onSubmit={submit} className="border-t border-trumi-charcoal p-4 lg:p-6">
          <label htmlFor="photo-note" className="sr-only">
            Add a note for this photo
          </label>
          <div className="flex gap-2">
            <input
              id="photo-note"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="e.g. crop tighter for the cover"
              className="h-11 min-w-0 flex-1 rounded-full border border-white/20 bg-trumi-ink px-4 text-sm text-white placeholder:text-white/40 focus:border-white/60 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!draft.trim() || sending}
              aria-label="Send note"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white text-trumi-ink transition disabled:opacity-40"
            >
              <ArrowRight size={16} />
            </button>
          </div>
          <p className="mt-3 hidden text-xs text-white/50 lg:block">← → browse · F favourite · 1–3 labels · Esc close</p>
        </form>
      </aside>
    </div>
  );
}
