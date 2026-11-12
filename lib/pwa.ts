/** Registers the service worker in production builds. */
export function registerServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator) || process.env.NODE_ENV !== "production") return;
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch((error) => {
      console.error("[pwa] Service worker registration failed", error);
    });
  });
}

/** Removes cached gallery photos from this device (call on sign-out). */
export async function clearPrivateCache() {
  if (typeof window === "undefined") return;
  try {
    navigator.serviceWorker?.controller?.postMessage({ type: "CLEAR_PRIVATE_CACHE" });
    if ("caches" in window) await caches.delete("trumi-photos");
  } catch {
    // Best effort only.
  }
}
