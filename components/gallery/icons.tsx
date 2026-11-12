import { cn } from "../../lib/utils";

/** Filled/outlined heart used across the client gallery (matches brand red when active). */
export function HeartIcon({ filled, className }: { filled?: boolean; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={cn("h-4 w-4", className)}
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinejoin="round"
    >
      <path d="M12 20s-7-4.4-9.2-8.6C1.4 8.6 3 5 6.4 5c2 0 3.4 1.1 4.1 2.3h3C14.2 6.1 15.6 5 17.6 5 21 5 22.6 8.6 21.2 11.4 19 15.6 12 20 12 20z" />
    </svg>
  );
}
