import { cn } from "../lib/utils";

const labels: Record<string, string> = {
  DRAFT: "Draft",
  SHARED: "Shared",
  IN_REVIEW: "In review",
  APPROVED: "Approved",
  COMPLETED: "Completed",
  HIDDEN: "Hidden",
  CLIENT_REVIEW: "Client review",
  PENDING: "Pending",
  SUBMITTED: "Submitted",
};

const tones: Record<string, string> = {
  DRAFT: "border-zinc-700 text-zinc-400",
  SHARED: "border-brand-red/50 text-brand-red",
  IN_REVIEW: "border-amber-300/40 text-amber-200",
  APPROVED: "border-emerald-300/40 text-emerald-200",
  COMPLETED: "border-sky-300/40 text-sky-200",
  HIDDEN: "border-zinc-700 text-zinc-500",
  CLIENT_REVIEW: "border-brand-red/50 text-brand-red",
  PENDING: "border-zinc-700 text-zinc-400",
  SUBMITTED: "border-amber-300/40 text-amber-200",
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em]",
        tones[status] || "border-white/15 text-zinc-300",
        className,
      )}
    >
      {labels[status] || status}
    </span>
  );
}
