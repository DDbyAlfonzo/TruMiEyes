import { cn } from "../lib/utils";

type BrandMarkProps = {
  compact?: boolean;
  size?: "sm" | "md" | "lg";
  tone?: "light" | "dark";
  className?: string;
};

const wordmarkHeights = {
  sm: "h-3",
  md: "h-[15px]",
  lg: "h-5 md:h-6",
};

/**
 * Official TRUMIEYES wordmark (from the Tru Mi Eyes logo sheet).
 * `tone="light"` = white letters for dark surfaces; `tone="dark"` = ink letters for light surfaces.
 */
export function BrandMark({ compact, size = "md", tone = "light", className }: BrandMarkProps) {
  return (
    <span className={cn("inline-flex items-center gap-3", className)}>
      <img
        src={tone === "light" ? "/brand/wordmark-white.svg" : "/brand/wordmark.svg"}
        alt="TruMiEyes"
        className={cn("w-auto", wordmarkHeights[size])}
      />
      {!compact && (
        <span className={cn("min-w-0 border-l pl-3", tone === "light" ? "border-line" : "border-hairline")}>
          <span className="block text-[10px] uppercase tracking-[0.28em] text-brand-red">Studio proofing</span>
        </span>
      )}
    </span>
  );
}
