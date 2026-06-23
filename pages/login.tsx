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
    <main className="grid min-h-screen bg-background text-white lg:grid-cols-[minmax(0,1.15fr)_minmax(420px,0.85fr)]">
      <section className="relative hidden min-h-screen overflow-hidden lg:block">
        <img src="/bg.jpg" alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/25 via-black/15 to-background" />
        <div className="absolute bottom-12 left-12 max-w-xl">
          <BrandMark size="lg" className="mb-10" />
          <p className="page-kicker">Private client proofing</p>
          <h1 className="mt-4 font-serif text-7xl font-light leading-none tracking-wide">
            Your story, presented with care.
          </h1>
          <p className="mt-6 max-w-md text-base leading-7 text-zinc-300">
            A refined workspace for reviewing sessions, selecting favourites, and preparing final image delivery.
          </p>
        </div>
      </section>

      <section className="flex min-h-screen items-center justify-center px-5 py-10">
        <div className="w-full max-w-md">
          <div className="mb-10 text-center">
            <div className="mx-auto mb-5 flex justify-center">
              <BrandMark size="lg" />
            </div>
            <div className="mx-auto h-px w-20 bg-brand-red/40" />
          </div>

          <div className="luxury-panel p-6 md:p-8">
            <div className="mb-8 grid grid-cols-2 rounded-full border border-line bg-black/25 p-1">
              {(["CLIENT", "ADMIN"] as const).map((role) => (
                <button
                  key={role}
                  className={`rounded-full px-4 py-2 text-sm transition ${
                    roleView === role ? "bg-champagne text-black" : "text-zinc-400 hover:text-white"
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
    </main>
  );
}
