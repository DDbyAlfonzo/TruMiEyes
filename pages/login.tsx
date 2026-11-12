import Head from "next/head";
import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/router";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import { readApiMessage } from "../lib/clientApi";
import { STUDIO_CONTACT_NAME } from "../lib/studio";

const fieldClass =
  "h-12 w-full rounded-xl border border-white/15 bg-white/[0.06] px-4 text-[15px] text-white outline-none transition placeholder:text-white/35 focus:border-white/60 focus:bg-white/[0.09]";

export default function LoginPage({ afterSignIn }: { afterSignIn?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setNotice("");
    setLoading(true);
    try {
      const result = await signIn("credentials", { email: email.trim().toLowerCase(), password, redirect: false });
      if (!result?.ok || result.error) {
        setError("That email and password don't match. Try again or reset your password.");
        return;
      }
      const session = await (await fetch("/api/auth/session")).json().catch(() => null);
      const role = session?.user?.role as "ADMIN" | "CLIENT" | undefined;
      await router.replace(afterSignIn || (role === "ADMIN" ? "/admin" : "/client"));
    } catch {
      setError("We couldn't sign you in just now. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!email.trim()) {
      setError("Enter your email above, then tap “Forgot password” again.");
      return;
    }
    setError("");
    setNotice("");
    setResetting(true);
    try {
      const res = await fetch("/api/auth/request-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      if (res.ok) setNotice("If that email has an account, a reset link is on its way.");
      else setError(await readApiMessage(res, "We couldn't send a reset link."));
    } catch {
      setError("We couldn't send a reset link.");
    } finally {
      setResetting(false);
    }
  };

  return (
    <main className="min-h-[100svh] bg-trumi-ink text-white lg:grid lg:grid-cols-[minmax(0,1.15fr)_minmax(440px,0.85fr)]">
      <Head>
        <title>Sign in | TruMiEyes</title>
        <meta name="theme-color" content="#231F20" />
      </Head>

      <section className="relative h-[34vh] min-h-[240px] overflow-hidden lg:h-auto lg:min-h-[100svh]">
        <img src="/bg.jpg" alt="" className="absolute inset-0 h-full w-full object-cover object-[60%_40%] animate-tile-in" />
        <div className="absolute inset-0 bg-gradient-to-t from-trumi-ink via-trumi-ink/20 to-trumi-ink/30 lg:bg-gradient-to-r lg:from-trumi-ink/10 lg:via-transparent lg:to-trumi-ink" />
        <div className="absolute inset-x-0 bottom-0 hidden p-12 lg:block xl:p-16">
          <p className="text-[11px] uppercase tracking-brand text-white/80">Studio</p>
          <p className="mt-3 max-w-md font-display text-5xl font-extralight leading-[1.05]">Every gallery, booklet and selection in one place.</p>
        </div>
      </section>

      <section className="relative -mt-10 flex justify-center px-6 pb-12 lg:mt-0 lg:items-center lg:px-12 lg:py-16">
        <div className="w-full max-w-[400px] animate-tile-in">
          <img src="/brand/logo-stacked-white.svg" alt="TruMiEyes" className="mb-12 w-40" />

          <h1 className="font-display text-4xl font-extralight leading-tight">Welcome back</h1>
          <p className="mt-2 text-[15px] text-white/65">Sign in to manage galleries and booklets.</p>

          <form onSubmit={handleLogin} className="mt-9 space-y-5" noValidate>
            <label className="block space-y-2">
              <span className="text-sm text-white/75">Email</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                inputMode="email"
                required
                className={fieldClass}
              />
            </label>
            <label className="block space-y-2">
              <span className="flex items-center justify-between text-sm text-white/75">
                Password
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={loading || resetting}
                  className="text-[13px] text-white/60 underline-offset-4 hover:text-white hover:underline"
                >
                  {resetting ? "Sending…" : "Forgot password?"}
                </button>
              </span>
              <span className="relative block">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  required
                  className={`${fieldClass} pr-12`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-1 top-1 inline-flex h-10 w-10 items-center justify-center rounded-lg text-white/55 hover:text-white"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </span>
            </label>

            <p aria-live="polite" className="min-h-[1.25rem] text-sm leading-6">
              {error && <span className="text-[#F7B2B5]">{error}</span>}
              {notice && <span className="text-emerald-200">{notice}</span>}
            </p>

            <button
              type="submit"
              disabled={loading || resetting || !email || !password}
              className="inline-flex h-[52px] w-full items-center justify-center gap-2 rounded-full bg-trumi-red text-[15px] font-semibold text-white transition hover:bg-trumi-red-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-trumi-ink disabled:opacity-50"
            >
              {loading ? "Signing in…" : "Sign in"}
              {!loading && <ArrowRight size={17} />}
            </button>
          </form>

          <div className="mt-10 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm leading-6 text-white/70">
            <span className="font-semibold text-white">Looking for your photos?</span> Open the gallery link {STUDIO_CONTACT_NAME} sent you and enter your
            code — no password needed.
          </div>
        </div>
      </section>
    </main>
  );
}
