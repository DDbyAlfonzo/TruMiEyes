import { useEffect, useState } from "react";
import { Smartphone } from "lucide-react";

type BeforeInstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

/** Nudges clients to add their gallery to the home screen (native prompt on Android, hint on iOS). */
export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIos, setIsIos] = useState(false);
  const [installed, setInstalled] = useState(true);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches || (navigator as unknown as { standalone?: boolean }).standalone === true;
    setInstalled(standalone);
    setIsIos(/iphone|ipad|ipod/i.test(navigator.userAgent));
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  if (installed || (!deferred && !isIos)) return null;

  const content = (
    <>
      <Smartphone size={20} className="shrink-0" />
      <span className="text-left text-[13px] leading-5 text-white/90">
        {deferred
          ? "Add your gallery to your home screen — one tap away, like an app."
          : "Keep your gallery one tap away: tap Share, then “Add to Home Screen”."}
      </span>
    </>
  );

  return deferred ? (
    <button
      type="button"
      onClick={async () => {
        await deferred.prompt();
        setDeferred(null);
      }}
      className="flex w-full items-center gap-3 rounded-2xl border border-white/15 bg-white/10 p-3.5 text-white backdrop-blur transition hover:bg-white/15"
    >
      {content}
    </button>
  ) : (
    <div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 p-3.5 text-white backdrop-blur">{content}</div>
  );
}
