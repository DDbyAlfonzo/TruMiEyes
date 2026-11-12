import { useState } from "react";
import { Copy, KeyRound, Link2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { readApiJson } from "../lib/clientApi";
import { Card } from "./ui/card";
import { Button } from "./ui/button";

type GalleryAccessCardProps = {
  projectId: string;
  shareUrl: string | null;
  codeActive: boolean;
  disabled?: boolean;
};

/** Studio control for the client's link + 6-digit code. The code is shown once, right after it's created. */
export function GalleryAccessCard({ projectId, shareUrl: initialUrl, codeActive: initialActive, disabled }: GalleryAccessCardProps) {
  const [shareUrl, setShareUrl] = useState(initialUrl);
  const [codeActive, setCodeActive] = useState(initialActive);
  const [freshCode, setFreshCode] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const createCode = async () => {
    setBusy(true);
    try {
      const data = await readApiJson<{ url: string; code: string }>(
        await fetch("/api/admin/gallery-access", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ projectId }),
        }),
        "Couldn't create a gallery code.",
      );
      setShareUrl(data.url);
      setFreshCode(data.code);
      setCodeActive(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't create a gallery code.");
    } finally {
      setBusy(false);
    }
  };

  const turnOff = async () => {
    setBusy(true);
    try {
      await readApiJson(
        await fetch("/api/admin/gallery-access", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ projectId }),
        }),
        "Couldn't turn off the gallery code.",
      );
      setCodeActive(false);
      setFreshCode(null);
      toast.success("Gallery link turned off.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't turn off the gallery code.");
    } finally {
      setBusy(false);
    }
  };

  const copy = async (text: string, what: string) => {
    await navigator.clipboard.writeText(text);
    toast.success(`${what} copied.`);
  };

  const message = shareUrl && freshCode ? `Your photos are ready! Open your gallery: ${shareUrl}\nYour code: ${freshCode}` : "";

  return (
    <Card className="bg-black/30 p-4">
      <p className="page-kicker">Client link</p>
      {codeActive && shareUrl ? (
        <div className="mt-4 space-y-3">
          <button
            type="button"
            onClick={() => copy(shareUrl, "Link")}
            className="flex w-full items-center gap-2 rounded-xl border border-line px-3 py-2.5 text-left text-sm text-zinc-200 hover:border-brand-red/60"
          >
            <Link2 size={15} className="shrink-0" />
            <span className="min-w-0 flex-1 truncate">{shareUrl}</span>
            <Copy size={14} className="shrink-0 text-muted" />
          </button>
          {freshCode ? (
            <div className="rounded-xl border border-brand-red/40 bg-brand-red/10 p-3">
              <p className="text-xs text-zinc-300">New code — copy it now, it won't be shown again:</p>
              <p className="mt-1 font-mono text-2xl tracking-[0.3em] text-white">{freshCode}</p>
              <Button size="sm" className="mt-3 w-full" onClick={() => copy(message, "Message")}>
                <Copy size={14} /> Copy link + code message
              </Button>
            </div>
          ) : (
            <p className="text-xs leading-5 text-muted">A code is active. Create a new one if the client lost theirs — the old code stops working.</p>
          )}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1" onClick={createCode} disabled={busy || disabled}>
              <RefreshCw size={14} /> New code
            </Button>
            <Button variant="ghost" size="sm" onClick={turnOff} disabled={busy || disabled}>
              Turn off
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          <p className="text-xs leading-5 text-muted">
            Give the client a private link and a 6-digit code — no account or password needed.
          </p>
          <Button className="w-full" onClick={createCode} disabled={busy || disabled}>
            <KeyRound size={15} /> {busy ? "Creating…" : "Create link + code"}
          </Button>
        </div>
      )}
    </Card>
  );
}
