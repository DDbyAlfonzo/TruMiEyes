import { useState } from "react";
import { useRouter } from "next/router";
import { readApiMessage } from "../lib/clientApi";

export default function AdminSignup() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [invite, setInvite] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setMessage("");
    if (!email.trim() || !password || !invite.trim()) {
      setError("Enter your email, password, and admin invite code.");
      return;
    }
    setLoading(true);

    try {
      const res = await fetch("/api/auth/admin-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email: email.trim().toLowerCase(),
          password,
          invite: invite.trim(),
        }),
      });

      if (!res.ok) {
        setError(await readApiMessage(res, "Unable to create admin account."));
        return;
      }
      setMessage("Admin account created. You can sign in now.");
      setTimeout(() => router.push("/login"), 1200);
    } catch {
      setError("Unable to create admin account.");
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
        <h1 className="text-2xl font-semibold mb-2">Create admin account</h1>
        <p className="text-white/60 mb-6">Use your admin invite code.</p>
        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <input
            className="w-full rounded-xl bg-black/30 border border-white/10 px-4 py-3"
            placeholder="Name"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <input
            type="email"
            className="w-full rounded-xl bg-black/30 border border-white/10 px-4 py-3"
            placeholder="Email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
          <input
            type="password"
            className="w-full rounded-xl bg-black/30 border border-white/10 px-4 py-3"
            placeholder="Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            minLength={6}
          />
          <input
            className="w-full rounded-xl bg-black/30 border border-white/10 px-4 py-3"
            placeholder="Admin invite code"
            value={invite}
            onChange={(event) => setInvite(event.target.value)}
            required
          />
          {error && <p className="text-sm text-red-400">{error}</p>}
          {message && <p className="text-sm text-green-400">{message}</p>}
          <button className="w-full rounded-full bg-trumi-red py-3 font-semibold" disabled={loading}>
            {loading ? "Creating..." : "Create admin"}
          </button>
        </form>
      </div>
    </main>
  );
}
