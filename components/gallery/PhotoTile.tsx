import { memo } from "react";
import { MessageCircle } from "lucide-react";
import { cn } from "../../lib/utils";
import { labelByColor } from "../../lib/labels";
import { HeartIcon } from "./icons";
import type { GalleryPhoto, PhotoState } from "./types";

type PhotoTileProps = {
  photo: GalleryPhoto;
  state: PhotoState;
  index: number;
  locked: boolean;
  onOpen: () => void;
  onToggleFavourite: () => void;
};

function PhotoTileBase({ photo, state, index, locked, onOpen, onToggleFavourite }: PhotoTileProps) {
  const label = state.label ? labelByColor[state.label] : null;

  return (
    <figure
      className="group relative mb-2 break-inside-avoid overflow-hidden rounded-md bg-stone animate-tile-in md:mb-3"
      style={{ animationDelay: `${Math.min(index, 12) * 40}ms` }}
    >
      <button
        type="button"
        onClick={onOpen}
        aria-label={`Open ${photo.filename}`}
        className="block w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-trumi-red"
      >
        <img
          src={photo.thumbUrl}
          alt={photo.filename}
          loading={index < 6 ? "eager" : "lazy"}
          decoding="async"
          className="block w-full transition duration-700 ease-out group-hover:scale-[1.025]"
        />
      </button>

      {label && (
        <span
          className="pointer-events-none absolute right-3 top-3 h-3 w-3 rounded-full border-2 border-white shadow"
          style={{ background: label.swatch }}
          aria-label={label.name}
          role="img"
        />
      )}

      <figcaption className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 bg-gradient-to-t from-black/55 via-black/0 to-transparent p-2.5 pt-10 opacity-100 transition duration-200 md:translate-y-1.5 md:opacity-0 md:group-focus-within:translate-y-0 md:group-focus-within:opacity-100 md:group-hover:translate-y-0 md:group-hover:opacity-100">
        <span className="hidden truncate text-xs text-white/90 md:block">{photo.filename}</span>
        <span className="pointer-events-auto ml-auto flex items-center gap-1.5">
          {state.comments.length > 0 && (
            <span className="hidden h-9 items-center gap-1 rounded-full bg-white/95 px-3 text-xs font-semibold text-trumi-ink md:inline-flex">
              <MessageCircle size={14} /> {state.comments.length}
            </span>
          )}
          <button
            type="button"
            onClick={onToggleFavourite}
            disabled={locked}
            aria-pressed={state.favourite}
            aria-label={state.favourite ? "Remove from favourites" : "Add to favourites"}
            className={cn(
              "inline-flex h-10 w-10 items-center justify-center rounded-full transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:opacity-60",
              state.favourite ? "bg-trumi-red text-white" : "bg-white/95 text-trumi-ink hover:bg-white",
            )}
          >
            <HeartIcon filled={state.favourite} className={state.favourite ? "animate-heart-pop" : undefined} />
          </button>
        </span>
      </figcaption>

      {state.favourite && (
        <span className="pointer-events-none absolute left-3 top-3 hidden h-7 w-7 items-center justify-center rounded-full bg-trumi-red text-white shadow transition md:inline-flex md:group-hover:opacity-0">
          <HeartIcon filled className="h-3.5 w-3.5" />
        </span>
      )}
    </figure>
  );
}

export const PhotoTile = memo(PhotoTileBase);
