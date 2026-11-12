/**
 * DEMO ONLY — fakes the API so /demo pages work without a database.
 * Any 6-digit code ending in 1 is "wrong"; anything else opens the gallery.
 */
let installed = false;

export function installDemoMocks() {
  if (installed || typeof window === "undefined") return;
  installed = true;
  const realFetch = window.fetch.bind(window);
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    const path = new URL(url, window.location.origin).pathname;
    if (!path.startsWith("/api/")) return realFetch(input, init);

    await new Promise((resolve) => setTimeout(resolve, 250));
    if (path === "/api/auth/session") {
      return json({ user: { name: "Thandi", email: "thandi@example.com", role: "CLIENT", id: "demo" }, expires: "2099-01-01" });
    }
    if (path === "/api/auth/csrf") return json({ csrfToken: "demo" });
    if (path === "/api/auth/providers") {
      return json({ gallery: { id: "gallery", name: "Gallery code", type: "credentials", signinUrl: "/api/auth/signin/gallery", callbackUrl: "/api/auth/callback/gallery" } });
    }
    if (path.startsWith("/api/auth/callback/")) {
      const body = new URLSearchParams(String(init?.body || ""));
      const ok = !String(body.get("code") || "").endsWith("1");
      return ok
        ? json({ url: `${window.location.origin}/demo/gallery` })
        : json({ url: `${window.location.origin}/api/auth/error?error=CredentialsSignin` }, 401);
    }
    if (path === "/api/comments") {
      const body = JSON.parse(String(init?.body || "{}"));
      return json({ id: `c${Date.now()}`, message: body.message, createdAt: new Date().toISOString() }, 201);
    }
    if (path === "/api/labels") {
      const body = JSON.parse(String(init?.body || "{}"));
      return json({ photoId: body.photoId, color: body.color });
    }
    return json({ ok: true });
  };
}
