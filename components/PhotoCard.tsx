import { Download, Heart, MessageCircle } from "lucide-react";
import { cn } from "../lib/utils";
import { Button } from "./ui/button";
import { ImageWithFallback } from "./ImageWithFallback";

type PhotoCardProps = {
  imageUrl: string;
  downloadUrl?: string;
  filename: string;
  selected?: boolean;
  downloadable?: boolean;
  commentCount?: number;
  className?: string;
  onOpen: () => void;
  onToggleFavorite?: () => void;
};

export function PhotoCard({
  imageUrl,
  downloadUrl,
  filename,
  selected,
  downloadable,
  commentCount = 0,
  className,
  onOpen,
  onToggleFavorite,
}: PhotoCardProps) {
  return (
    <article className={cn("group break-inside-avoid overflow-hidden rounded-3xl bg-surface", className)}>
      <button
        className="relative block min-h-[220px] w-full overflow-hidden bg-black text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-champagne"
        onClick={onOpen}
        aria-label={`Open ${filename}`}
      >
        <ImageWithFallback
          src={imageUrl}
          alt={filename}
          className="w-full object-cover transition duration-500 group-hover:scale-[1.03]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-black/10 opacity-0 transition group-hover:opacity-100" />
        <div className="absolute bottom-3 left-3 right-3 flex translate-y-2 items-center justify-between gap-2 opacity-0 transition group-hover:translate-y-0 group-hover:opacity-100">
          <p className="truncate text-sm text-white">{filename}</p>
          <span className="text-xs text-zinc-300">View</span>
        </div>
      </button>
      <div className="flex items-center justify-between gap-2 border-x border-b border-line px-3 py-3">
        <div className="min-w-0">
          <p className="truncate text-sm text-zinc-200">{filename}</p>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-zinc-500">
            {downloadable && (
              <a
                className="inline-flex items-center gap-1 rounded-full outline-none transition hover:text-champagne focus-visible:ring-2 focus-visible:ring-champagne"
                href={downloadUrl || imageUrl}
                download={filename}
                onClick={(event) => event.stopPropagation()}
              >
                <Download size={12} /> Download
              </a>
            )}
            {commentCount > 0 && (
              <span className="inline-flex items-center gap-1">
                <MessageCircle size={12} /> {commentCount}
              </span>
            )}
          </div>
        </div>
        {onToggleFavorite && (
          <Button
            variant={selected ? "primary" : "outline"}
            size="icon"
            onClick={onToggleFavorite}
            aria-label={selected ? "Remove favourite" : "Add favourite"}
            className={selected ? "bg-brand-red text-white hover:bg-[#C23A3A]" : ""}
          >
            <Heart size={16} className={selected ? "fill-white" : ""} />
          </Button>
        )}
      </div>
    </article>
  );
}
