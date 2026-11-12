import Head from "next/head";
import { FormEvent, KeyboardEvent, ReactNode, Ref, useEffect, useRef, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/router";
import { ArrowRight, Check, Eye, EyeOff, Loader2 } from "lucide-react";
import { readApiMessage } from "../lib/clientApi";
import { STUDIO_CONTACT_NAME } from "../lib/studio";
import { cn } from "../lib/utils";

const SLIDES = [
  { src: "/login/1.jpg", position: "60% 40%" },
  { src: "/login/2.jpg", position: "50% 45%" },
  { src: "/login/3.jpg", position: "50% 50%" },
];
const SLIDE_MS = 6500;
const REMEMBER_KEY = "trumi:last-email";

type Status = "idle" | "loading" | "success";

type FieldProps = {
  id: string;
  label: string;
  type: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
  inputMode?: "email" | "text";
  invalid?: boolean;
  trailing?: ReactNode;
  onKeyUp?: (event: KeyboardEvent<HTMLInputElement>) => void;
  inputRef?: Ref<HTMLInputElement>;
};

/** Floating-label field used on the sign-in card. */
function Field({ id, label, type, value, onChange, autoComplete, inputMode, invalid, trailing, onKeyUp, inputRef }: FieldProps) {
  return (
    <div className="relative">
      <input
        ref={inputRef}
        id={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyUp={onKeyUp}
        autoComplete={autoComplete}
        inputMode={inputMode}
        placeholder=" "
        aria-invalid={invalid || undefined}
        required
        className={cn(
          "peer h-[58px] w-full rounded-2xl border bg-white/[0.06] px-4 pb-2 pt-6 text-[15px] text-white outline-none transition",
          "focus:border-white/70 focus:bg-white/[0.1]",
          invalid ? "border-[#F07A7E]/80" : "border-white/15 hover:border-white/30",
          trailing && "pr-14",
        )}
      />
      <label
        htmlFor={id}
        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[15px] text-white/55 transition-all duration-200 ease-out peer-focus:top-[17px] peer-focus:text-[11px] peer-focus:tracking-[0.06em] peer-focus:text-white/70 peer-[:not(:placeholder-shown)]:top-[17px] peer-[:not(:placeholder-shown)]:text-[11px] peer-[:not(:placeholder-shown)]:tracking-[0.06em]"
      >
        {label}
      </label>
      {trailing && <div className="absolute right-1.5 top-1/2 -translate-y-1/2">{trailing}</div>}
    </div>
  );
}

export default function LoginPage({ afterSignIn }: { afterSignIn?: string }) {
  const router = useRouter();
  const passwordRef = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [shake, setShake] = useState(0);
  const [resetting, setResetting] = useState(false);
  const [slide, setSlide] = useState(0);

  // Remember the studio email on this device so sign-in is one field.
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(REMEMBER_KEY);
      if (saved) {
        setEmail(saved);
        passwordRef.current?.focus();
      }
    } catch {
      // Storage unavailable — fine.
    }
  }, []);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => setSlide((value) => (value + 1) % SLIDES.length), SLIDE_MS);
    return () => window.clearInterval(timer);
  }, []);

  const fail = (message: string) => {
    setError(message);
    setStatus("idle");
    setShake((value) => value + 1);
  };

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault();
    if (status !== "idle") return;
    setError("");
    setNotice("");
    if (!email.trim() || !password) return fail("Enter your email and password to continue.");
    setStatus("loading");
    try {
      const cleanEmail = email.trim().toLowerCase();
      const result = await signIn("credentials", { email: cleanEmail, password, redirect: false });
      if (!result?.ok || result.error) return fail("That email and password don't match. Try again, or reset your password.");
      try {
        window.localStorage.setItem(REMEMBER_KEY, cleanEmail);
      } catch {
        // ignore
      }
      setStatus("success");
      const session = await (await fetch("/api/auth/session")).json().catch(() => null);
      const role = session?.user?.role as "ADMIN" | "CLIENT" | undefined;
      await router.replace(afterSignIn || (role === "ADMIN" ? "/admin" : "/client"));
    } catch {
      fail("We couldn't sign you in just now. Please try again.");
    }
  };

  const handleReset = async () => {
    if (!email.trim()) return fail("Enter your email first, then tap “Forgot password?”.");
    setError("");
    setNotice("");
    setResetting(true);
    try {
      const res = await fetch("/api/auth/request-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      if (res.ok) setNotice(`If ${email.trim()} has an account, a reset link is on its way.`);
      else fail(await readApiMessage(res, "We couldn't send a reset link."));
    } catch {
      fail("We couldn't send a reset link.");
    } finally {
      setResetting(false);
    }
  };

  const busy = status !== "idle";

  return (
    <main className="relative min-h-[100svh] overflow-hidden bg-trumi-ink text-white">
      <Head>
        <title>Sign in | TruMiEyes</title>
        <meta name="theme-color" content="#231F20" />
      </Head>

      {/* George's work, slowly crossfading behind everything */}
      <div aria-hidden="true" className="absolute inset-0">
        {SLIDES.map((item, i) => (
          <img
            key={item.src}
            src={item.src}
            alt=""
            {...{ fetchpriority: i === 0 ? "high" : "low" }}
            className={cn(
              "absolute inset-0 h-full w-full object-cover transition-opacity duration-[1600ms] ease-out motion-safe:animate-[login-drift_20s_ease-in-out_infinite_alternate]",
              i === slide ? "opacity-100" : "opacity-0",
            )}
            style={{ objectPosition: item.position }}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-t from-trumi-ink via-trumi-ink/55 to-trumi-ink/10 lg:bg-gradient-to-r lg:from-transparent lg:via-transparent lg:to-trumi-ink/60" />
        {/* Keep the logo and headline readable over bright photos */}
        <div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-trumi-ink/70 to-transparent" />
        <div className="absolute inset-0 hidden bg-gradient-to-r from-trumi-ink/80 from-5% via-trumi-ink/35 via-35% to-transparent to-55% lg:block" />
        <div className="absolute inset-x-0 bottom-0 hidden h-1/2 bg-gradient-to-t from-trumi-ink/75 to-transparent lg:block" />
      </div>

      <div className="relative mx-auto flex min-h-[100svh] max-w-[1360px] flex-col px-5 pb-6 pt-8 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:gap-16 lg:px-14 lg:py-12">
        {/* Brand + promise */}
        <section className="flex flex-1 flex-col lg:h-[min(760px,88svh)] lg:justify-between">
          <img src="/brand/logo-stacked-white.svg" alt="TruMiEyes" className="w-32 animate-tile-in sm:w-36 lg:w-40" />

          <div className="mt-auto hidden max-w-lg animate-tile-in lg:block" style={{ animationDelay: "120ms" }}>
            <p className="text-[11px] uppercase tracking-brand text-white/75">The studio</p>
            <h1 className="mt-4 font-display text-6xl font-extralight leading-[1.02]">
              Galleries clients <span className="text-trumi-red">love</span> to choose from.
            </h1>
            <ul className="mt-8 grid max-w-md grid-cols-3 gap-4 text-[13px] leading-5 text-white/80">
              <li className="border-t border-white/25 pt-3">Share with a link and a code</li>
              <li className="border-t border-white/25 pt-3">Booklets from your sketches</li>
              <li className="border-t border-white/25 pt-3">Every selection in one place</li>
            </ul>
            <div className="mt-10 flex gap-1.5" aria-hidden="true">
              {SLIDES.map((item, i) => (
                <span key={item.src} className="h-0.5 w-8 overflow-hidden rounded-full bg-white/25">
                  <span
                    key={`${slide}-${i}`}
                    className={cn(
                      "block h-full bg-white",
                      i === slide ? "w-0 motion-safe:animate-[login-progress_6.5s_linear_forwards] motion-reduce:w-full" : i < slide ? "w-full" : "w-0",
                    )}
                  />
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Sign-in card */}
        <section className="mt-auto w-full animate-tile-in lg:mt-0 lg:w-[440px]" style={{ animationDelay: "60ms" }}>
          <div
            key={shake}
            className={cn(
              "rounded-[28px] border border-white/10 bg-trumi-ink/70 p-6 shadow-[0_30px_80px_rgba(0,0,0,0.45)] backdrop-blur-2xl sm:p-9",
              shake > 0 && "motion-safe:animate-[login-shake_0.4s_ease-in-out]",
            )}
          >
            <h2 className="font-display text-[34px] font-extralight leading-tight">Welcome back</h2>
            <p className="mt-1.5 text-[15px] text-white/65">Sign in to your studio.</p>

            <form onSubmit={handleLogin} className="mt-7 space-y-3.5" noValidate>
              <Field
                id="email"
                label="Email"
                type="email"
                value={email}
                onChange={(value) => {
                  setEmail(value);
                  setError("");
                }}
                autoComplete="email"
                inputMode="email"
                invalid={Boolean(error)}
              />
              <Field
                id="password"
                label="Password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(value) => {
                  setPassword(value);
                  setError("");
                }}
                autoComplete="current-password"
                invalid={Boolean(error)}
                inputRef={passwordRef}
                onKeyUp={(event) => setCapsLock(event.getModifierState?.("CapsLock") ?? false)}
                trailing={
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    aria-pressed={showPassword}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-white/55 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                }
              />

              <div className="flex min-h-[24px] items-center justify-between gap-3 text-[13px]">
                <span className="text-amber-200/90" aria-live="polite">
                  {capsLock ? "Caps Lock is on" : ""}
                </span>
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={busy || resetting}
                  className="shrink-0 text-white/65 underline-offset-4 transition hover:text-white hover:underline disabled:opacity-50"
                >
                  {resetting ? "Sending link…" : "Forgot password?"}
                </button>
              </div>

              <p aria-live="assertive" className={cn("text-sm leading-6", error || notice ? "block" : "hidden")}>
                {error && <span className="text-[#F7B2B5]">{error}</span>}
                {notice && <span className="text-emerald-200">{notice}</span>}
              </p>

              <button
                type="submit"
                disabled={busy}
                className={cn(
                  "group relative inline-flex h-[56px] w-full items-center justify-center gap-2 overflow-hidden rounded-full text-[15px] font-semibold text-white transition duration-300",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-trumi-ink",
                  status === "success" ? "bg-emerald-600" : "bg-trumi-red hover:bg-trumi-red-deep",
                )}
              >
                {status === "idle" && (
                  <>
                    Sign in
                    <ArrowRight size={17} className="transition-transform duration-300 group-hover:translate-x-1" />
                  </>
                )}
                {status === "loading" && (
                  <>
                    <Loader2 size={18} className="animate-spin" /> Signing in…
                  </>
                )}
                {status === "success" && (
                  <>
                    <Check size={18} /> Opening your studio…
                  </>
                )}
              </button>
            </form>

            <div className="mt-7 flex items-start gap-3 border-t border-white/10 pt-6 text-[13px] leading-6 text-white/65">
              <img src="/brand/mark-white.svg" alt="" className="mt-[7px] h-2.5 w-auto shrink-0 opacity-80" />
              <p>
                <span className="font-semibold text-white">Here for your photos?</span> Open the gallery link {STUDIO_CONTACT_NAME} sent you and enter
                your code — no password needed.
              </p>
            </div>
          </div>
          <p className="mt-5 text-center text-xs text-white/45">© {new Date().getFullYear()} Tru Mi Eyes (Pty) Ltd</p>
        </section>
      </div>
    </main>
  );
}
