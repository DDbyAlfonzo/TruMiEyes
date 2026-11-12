import { cn } from "../../lib/utils";

type SelectionProgressProps = {
  count: number;
  /** Photos the chosen book layout fits; omit when no layout applies. */
  target?: number | null;
  tone?: "light" | "dark";
  /** Name of the chosen booklet, shown as the label. */
  bookletName?: string | null;
  className?: string;
};

export function SelectionProgress({ count, target, tone = "light", bookletName, className }: SelectionProgressProps) {
  const pct = target ? Math.min(100, Math.round((count / target) * 100)) : 0;
  const over = Boolean(target && count > target);

  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      <div className={cn("flex items-baseline justify-between gap-3 text-xs", tone === "light" ? "text-ink-soft" : "text-white/70")}>
        <span className="truncate">{target ? (bookletName ? `For your ${bookletName}` : "For your photo book") : "Your favourites"}</span>
        <span className={cn("font-semibold tabular-nums", tone === "light" ? "text-trumi-ink" : "text-white")}>
          {target ? `${count} of ${target}` : count}
        </span>
      </div>
      {target ? (
        <div
          role="progressbar"
          aria-label="Photo book selection"
          aria-valuemin={0}
          aria-valuemax={target}
          aria-valuenow={count}
          className={cn("h-1 overflow-hidden rounded-full", tone === "light" ? "bg-hairline" : "bg-white/20")}
        >
          <div
            className={cn("h-full rounded-full transition-[width] duration-500 ease-out", over ? "bg-label-amber" : "bg-trumi-red")}
            style={{ width: `${pct}%` }}
          />
        </div>
      ) : null}
    </div>
  );
}
