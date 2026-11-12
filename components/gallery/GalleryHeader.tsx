import Link from "next/link";
import { useState } from "react";
import { Check, LogOut, Share2 } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { clearPrivateCache } from "../../lib/pwa";
import { toast } from "sonner";
import { cn } from "../../lib/utils";

type GalleryHeaderProps = {
  /** Public gallery link to share (only when the studio has created one). */
  shareUrl?: string | null;
  shareTitle?: string;
  className?: string;
};

export function GalleryHeader({ shareUrl, shareTitle, className }: GalleryHeaderProps) {
  const { data: session } = useSession();
  const [copied, setCopied] = useState(false);
  const initial = (session?.user?.name || session?.user?.email || "T").trim()[0]?.toUpperCase();

  const share = async () => {
    if (!shareUrl) return;
    try {
      if (navigator.share) {
        await navigator.share({ title: shareTitle || "TruMiEyes gallery", url: shareUrl });
        return;
      }
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Gallery link copied. Share the code separately.");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Share sheet dismissed — nothing to do.
    }
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b border-hairline bg-paper/90 backdrop-blur-xl supports-[backdrop-filter]:bg-paper/80",
        className,
      )}
    >
      <div className="mx-auto flex h-16 max-w-[1360px] items-center justify-between gap-4 px-4 md:px-10">
        <Link href="/client" aria-label="Your galleries" className="flex h-11 items-center">
          <img src="/brand/wordmark.svg" alt="TruMiEyes" className="h-3 w-auto md:h-[15px]" />
        </Link>
        <div className="flex items-center gap-2">
          {shareUrl && (
            <button
              type="button"
              onClick={share}
              className="inline-flex h-11 items-center gap-2 rounded-full border border-hairline px-4 text-sm text-trumi-ink transition hover:border-trumi-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-trumi-red/40"
            >
              {copied ? <Check size={16} /> : <Share2 size={16} />}
              <span className="hidden sm:inline">{copied ? "Copied" : "Share"}</span>
            </button>
          )}
          <details className="relative">
            <summary
              aria-label="Account"
              className="flex h-11 w-11 cursor-pointer list-none items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-trumi-red/40 [&::-webkit-details-marker]:hidden"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-trumi-ink text-sm font-semibold text-white">
                {initial}
              </span>
            </summary>
            <div className="absolute right-0 top-12 w-60 overflow-hidden rounded-2xl border border-hairline bg-white p-2 shadow-[0_20px_50px_rgba(35,31,32,0.14)]">
              <div className="border-b border-hairline px-3 py-3">
                <p className="truncate text-sm font-semibold text-trumi-ink">{session?.user?.name || "Your account"}</p>
                <p className="mt-0.5 truncate text-xs text-ink-soft">{session?.user?.email}</p>
              </div>
              <Link href="/client" className="mt-1 flex h-11 items-center rounded-xl px-3 text-sm text-trumi-ink hover:bg-paper">
                All your galleries
              </Link>
              <button
                type="button"
                onClick={async () => {
                  await clearPrivateCache();
                  signOut({ callbackUrl: "/login" });
                }}
                className="flex h-11 w-full items-center gap-2 rounded-xl px-3 text-left text-sm text-trumi-ink hover:bg-paper"
              >
                <LogOut size={16} /> Sign out
              </button>
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}
