import { useRouter } from "next/router";
import { useState } from "react";
import { readApiMessage } from "../lib/clientApi";

export default function ResetPage() {
  const router = useRouter();
  const { token, email } = router.query;
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReset = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setMessage("");
    const tokenValue = typeof token === "string" ? token : "";
    const emailValue = typeof email === "string" ? email : "";
    if (!tokenValue || !emailValue) {
      setError("This reset link is incomplete or invalid.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: tokenValue, email: emailValue, password }),
      });
      if (res.ok) {
        setMessage("Password reset successful. You can sign in now.");
        setTimeout(() => router.push("/login"), 1200);
      } else {
        setError(await readApiMessage(res, "Reset link is invalid or expired."));
      }
    } catch {
      setError("Unable to reset your password right now.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-trumi-dark text-white flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#111318] p-10 shadow-2xl text-center">
        <img
          src="/trumieyeslogo.png"
          alt="TruMiEyes"
          className="mx-auto w-64 mb-6 brightness-0 invert"
        />
        <h1 className="text-2xl font-semibold mb-2">Reset password</h1>
        <p className="text-white/60 mb-6">Enter a new password to continue.</p>
        <form onSubmit={handleReset} className="space-y-4 text-left">
          <label className="block text-sm text-white/70">New password</label>
          <input
            type="password"
            className="w-full rounded-xl bg-black/30 border border-white/10 px-4 py-3 text-white"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            minLength={6}
          />
          {error && <p className="text-sm text-red-400">{error}</p>}
          {message && <p className="text-sm text-green-400">{message}</p>}
          <button className="w-full rounded-full bg-trumi-red py-3 font-semibold" disabled={loading}>
            {loading ? "Resetting password..." : "Reset password"}
          </button>
        </form>
      </div>
    </main>
  );
}
