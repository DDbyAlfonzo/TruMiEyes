import { Check, Images } from "lucide-react";
import { Button } from "./ui/button";

type SelectionBarProps = {
  selectedCount: number;
  viewFavoritesOnly: boolean;
  submitting?: boolean;
  locked?: boolean;
  onToggleFilter: () => void;
  onSubmit: () => void;
};

export function SelectionBar({
  selectedCount,
  viewFavoritesOnly,
  submitting,
  locked,
  onToggleFilter,
  onSubmit,
}: SelectionBarProps) {
  return (
    <div className="sticky top-20 z-20 -mx-5 border-y border-line bg-[#0f0f0f]/95 px-5 py-3 backdrop-blur-xl md:mx-0 md:rounded-full md:border md:px-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 text-sm text-zinc-300">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-red/15 text-brand-red">
            <Images size={17} />
          </span>
          <span>{selectedCount} selected</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onToggleFilter}>
            {viewFavoritesOnly ? "Show all" : "Favourites only"}
          </Button>
          <Button size="sm" onClick={onSubmit} disabled={locked || submitting}>
            <Check size={15} />
            {submitting ? "Submitting" : "Submit"}
          </Button>
        </div>
      </div>
    </div>
  );
}
