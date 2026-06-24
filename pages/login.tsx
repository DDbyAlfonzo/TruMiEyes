import { useState } from "react";
import { signIn, signOut } from "next-auth/react";
import { useRouter } from "next/router";
import { KeyRound, Mail } from "lucide-react";
import { readApiMessage } from "../lib/clientApi";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { BrandMark } from "../components/BrandMark";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [roleView, setRoleView] = useState<"ADMIN" | "CLIENT">("CLIENT");
  const [resetMessage, setResetMessage] = useState("");
  const [resetting, setResetting] = useState(false);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setResetMessage("");
    setLoading(true);
    try {
      const result = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });
      if (result?.error) {
        setError("Invalid credentials. Please try again.");
        return;
      }

      const sessionRes = await fetch("/api/auth/session");
      if (!sessionRes.ok) {
        setError("Signed in, but we could not load your account details. Please try again.");
        return;
      }

      const session = await sessionRes.json();
      const role = session?.user?.role as "ADMIN" | "CLIENT" | undefined;
      if (!role) {
        setError("Your account role could not be determined. Please try again.");
        return;
      }

      if (roleView !== role) {
        await signOut({ redirect: false });
        setError(`This account is ${role.toLowerCase()}. Switch to the ${role.toLowerCase()} tab and try again.`);
        return;
      }

      router.replace(role === "ADMIN" ? "/admin" : "/client");
    } catch {
      setError("Unable to sign in right now. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!email.trim()) {
      setError("Enter your email to reset your password.");
      return;
    }
    setError("");
    setResetMessage("");
    setResetting(true);

    try {
      const res = await fetch("/api/auth/request-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      if (res.ok) {
        setResetMessage(
          "If this email is associated with a user on our platform, you’ll receive a reset link shortly.",
        );
      } else {
        setError(await readApiMessage(res, "Unable to send reset email."));
      }
    } catch {
      setError("Unable to send reset email.");
    } finally {
      setResetting(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-white">
      <div className="absolute inset-0">
        <img src="/bg.jpg" alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-black/35 lg:bg-black/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/35 to-black/50 lg:from-black/70 lg:via-black/25 lg:to-black/45" />
        <div className="absolute inset-y-0 left-0 w-full bg-gradient-to-r from-black/45 via-transparent to-transparent lg:w-3/5" />
      </div>

      <div className="relative grid min-h-screen lg:grid-cols-[minmax(0,1.1fr)_minmax(420px,0.9fr)]">
        <section className="relative hidden min-h-screen items-end px-12 pb-16 lg:flex xl:px-20 xl:pb-20">
          <div className="max-w-2xl">
            <p className="page-kicker">Private client proofing</p>
            <h1 className="mt-4 font-serif text-7xl font-light leading-none tracking-wide drop-shadow-[0_5px_28px_rgba(0,0,0,0.82)] xl:text-8xl">
              Your story, presented with care.
            </h1>
            <p className="mt-6 max-w-md text-base leading-7 text-zinc-100 drop-shadow-[0_3px_18px_rgba(0,0,0,0.82)]">
              A refined workspace for reviewing sessions, selecting favourites, and preparing final image delivery.
            </p>
          </div>
        </section>

        <section className="relative flex min-h-screen items-center justify-center px-5 py-10">
          <div className="relative w-full max-w-md">
            <div className="mb-6 rounded-3xl border border-white/10 bg-black/35 p-6 shadow-2xl shadow-black/30 backdrop-blur-md lg:hidden">
              <p className="page-kicker">Private client proofing</p>
              <h1 className="mt-3 font-serif text-4xl font-light leading-tight tracking-wide drop-shadow-[0_4px_18px_rgba(0,0,0,0.75)]">
                Your story, presented with care.
              </h1>
              <p className="mt-4 text-sm leading-6 text-zinc-100 drop-shadow-[0_2px_12px_rgba(0,0,0,0.75)]">
                Review sessions, select favourites, and prepare final image delivery in one refined workspace.
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-[rgba(10,10,10,0.56)] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.42)] backdrop-blur-[20px] md:p-8">
              <div className="mb-8 flex flex-col items-center text-center">
                <BrandMark size="lg" />
                <div className="mt-5 h-px w-20 bg-brand-red/40" />
              </div>

              <div className="mb-8 grid grid-cols-2 rounded-full border border-white/10 bg-black/25 p-1 shadow-inner shadow-black/30">
                {(["CLIENT", "ADMIN"] as const).map((role) => (
                  <button
                    key={role}
                    className={`rounded-full px-4 py-2 text-sm transition ${
                      roleView === role
                        ? "bg-brand-red text-white shadow-lg shadow-brand-red/20"
                        : "text-zinc-300 hover:bg-white/5 hover:text-white"
                    }`}
                    onClick={() => setRoleView(role)}
                    type="button"
                  >
                    {role === "CLIENT" ? "Client" : "Admin"}
                  </button>
                ))}
              </div>

              <form onSubmit={handleLogin} className="space-y-5">
                <label className="block">
                  <span className="mb-2 flex items-center gap-2 text-sm text-zinc-400">
                    <Mail size={15} /> Email
                  </span>
                  <Input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                    autoComplete="email"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 flex items-center gap-2 text-sm text-zinc-400">
                    <KeyRound size={15} /> Password
                  </span>
                  <Input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    autoComplete="current-password"
                  />
                </label>
                {error && <p className="text-sm text-red-300">{error}</p>}
                {resetMessage && <p className="text-sm text-emerald-300">{resetMessage}</p>}
                <Button type="submit" className="w-full" disabled={loading || resetting}>
                  {loading ? "Signing in..." : "Enter portal"}
                </Button>
                <button
                  type="button"
                  className="w-full text-sm text-zinc-500 transition hover:text-white"
                  onClick={handleReset}
                  disabled={loading || resetting}
                >
                  {resetting ? "Sending reset link..." : "Forgot password?"}
                </button>
              </form>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
