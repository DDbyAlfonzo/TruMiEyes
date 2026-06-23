import { cn } from "../lib/utils";

type BrandMarkProps = {
  compact?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const imageSizes = {
  sm: "h-9",
  md: "h-12",
  lg: "h-16 md:h-20",
};

export function BrandMark({ compact, size = "md", className }: BrandMarkProps) {
  return (
    <span className={cn("inline-flex items-center gap-3", className)}>
      <img
        src="/trumieyeslogo.png"
        alt="TruMiEyes"
        className={cn("w-auto object-contain", imageSizes[size])}
      />
      {!compact && (
        <span className="min-w-0 border-l border-line pl-3">
          <span className="block text-[10px] uppercase tracking-[0.28em] text-brand-red">
            Studio proofing
          </span>
        </span>
      )}
    </span>
  );
}
