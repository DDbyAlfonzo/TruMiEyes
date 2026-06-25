import { KeyboardEvent as ReactKeyboardEvent, ReactNode, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "./ui/button";
import { ImageWithFallback } from "./ImageWithFallback";

type LightboxItem = {
  id: string;
  imageUrl: string;
  downloadUrl?: string;
  filename: string;
  downloadable?: boolean;
};

type Props = {
  items: LightboxItem[];
  initialIndex: number;
  onClose: () => void;
  renderActions?: (item: LightboxItem, index: number) => ReactNode;
};

export default function Lightbox({ items, initialIndex, onClose, renderActions }: Props) {
  const [index, setIndex] = useState(initialIndex);
  const touchStartX = useRef<number | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setIndex(initialIndex);
  }, [initialIndex]);

  useEffect(() => {
    dialogRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight") {
        setIndex((prev) => (prev + 1) % items.length);
      }
      if (event.key === "ArrowLeft") {
        setIndex((prev) => (prev - 1 + items.length) % items.length);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [items.length, onClose]);

  if (!items.length) return null;
  const item = items[index];
  const previous = () => setIndex((prev) => (prev - 1 + items.length) % items.length);
  const next = () => setIndex((prev) => (prev + 1) % items.length);

  const handleDialogKey = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") onClose();
    if (event.key === "ArrowRight") next();
    if (event.key === "ArrowLeft") previous();
  };

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={`Preview ${item.filename}`}
      tabIndex={-1}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black text-white outline-none"
      onKeyDown={handleDialogKey}
    >
      <div className="absolute inset-0 bg-black" onClick={onClose} />
      <div className="relative z-10 flex h-full w-full flex-col">
        <div className="pointer-events-none absolute left-0 right-0 top-0 z-20 bg-gradient-to-b from-black/80 to-transparent px-4 py-4 md:px-6">
          <div className="pointer-events-auto flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.22em] text-champagne/80">
              {index + 1} / {items.length}
            </p>
            <h3 className="truncate font-serif text-2xl font-light tracking-wide md:text-3xl">
              {item.filename}
            </h3>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {renderActions?.(item, index)}
            <Button variant="outline" size="icon" onClick={onClose} aria-label="Close preview">
              <X size={18} />
            </Button>
          </div>
          </div>
        </div>
        <div
          className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden p-3 md:p-8"
          onTouchStart={(event) => {
            touchStartX.current = event.touches[0]?.clientX ?? null;
          }}
          onTouchEnd={(event) => {
            if (touchStartX.current === null) return;
            const delta = event.changedTouches[0].clientX - touchStartX.current;
            touchStartX.current = null;
            if (Math.abs(delta) < 45) return;
            if (delta > 0) previous();
            else next();
          }}
        >
          <Button
            variant="outline"
            size="icon"
            className="absolute left-4 top-1/2 z-20 -translate-y-1/2 bg-black/35 backdrop-blur"
            onClick={previous}
            aria-label="Previous photo"
          >
            <ChevronLeft size={20} />
          </Button>
          <ImageWithFallback
            key={item.id}
            src={item.imageUrl}
            alt={item.filename}
            className="max-h-full max-w-full object-contain opacity-100 transition duration-300"
          />
          <Button
            variant="outline"
            size="icon"
            className="absolute right-4 top-1/2 z-20 -translate-y-1/2 bg-black/35 backdrop-blur"
            onClick={next}
            aria-label="Next photo"
          >
            <ChevronRight size={20} />
          </Button>
        </div>
        <p className="pointer-events-none absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-4 py-5 text-center text-xs text-white/35 md:px-6">
          Use arrow keys or swipe to navigate.
        </p>
      </div>
    </div>
  );
}
