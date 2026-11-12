import { cn } from "../../lib/utils";
import { PAGE_ASPECT, type Orientation, type Slot } from "../../lib/booklets";

type BookletPageProps = {
  orientation: Orientation;
  slots: Slot[];
  /** Photo URLs placed into the slots in order; empty slots show a soft placeholder. */
  photos?: string[];
  sketchUrl?: string;
  /** Show the studio's sketch under the slots (studio view / "see the sketch" toggle). */
  showSketch?: boolean;
  className?: string;
  label?: string;
};

/** A single booklet page drawn from its slots — the same renderer for the studio and clients. */
export function BookletPage({ orientation, slots, photos = [], sketchUrl, showSketch, className, label }: BookletPageProps) {
  return (
    <div
      role="img"
      aria-label={label}
      className={cn("relative w-full overflow-hidden bg-white shadow-[0_1px_2px_rgba(35,31,32,0.08),0_12px_30px_rgba(35,31,32,0.12)]", className)}
      style={{ aspectRatio: String(PAGE_ASPECT[orientation]) }}
    >
      {showSketch && sketchUrl && (
        <img src={sketchUrl} alt="" className="absolute inset-0 h-full w-full object-fill opacity-60 mix-blend-multiply" />
      )}
      {slots.map((slot, i) => {
        const photo = photos[i];
        return (
          <div
            key={i}
            className={cn("absolute overflow-hidden", photo ? "bg-stone" : "bg-stone/80 outline outline-1 outline-dashed outline-[#CFCAC2]")}
            style={{ left: `${slot.x * 100}%`, top: `${slot.y * 100}%`, width: `${slot.w * 100}%`, height: `${slot.h * 100}%` }}
          >
            {photo && <img src={photo} alt="" loading="lazy" className="h-full w-full object-cover" />}
          </div>
        );
      })}
    </div>
  );
}
