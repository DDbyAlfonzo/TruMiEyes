import { GetServerSideProps } from "next";
import { useState } from "react";
import { getServerSession } from "next-auth";
import { KeyRound, Mail, UserRound } from "lucide-react";
import { authOptions } from "../api/auth/[...nextauth]";
import { prisma } from "../../lib/prisma";
import { readApiJson } from "../../lib/clientApi";
import { AppShell } from "../../components/AppShell";
import { Card } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";

type SettingsProps = {
  account: {
    id: string;
    name: string | null;
    email: string;
  };
};

export default function AdminSettingsPage({ account }: SettingsProps) {
  const [name, setName] = useState(account.name || "");
  const [email, setEmail] = useState(account.email);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const saveAccount = async () => {
    setSaving(true);
    setMessage("");
    setError("");

    try {
      await readApiJson(
        await fetch("/api/admin/account", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            email,
            currentPassword,
            newPassword,
          }),
        }),
        "Unable to update account.",
      );
      setCurrentPassword("");
      setNewPassword("");
      setMessage("Account updated. Sign out and back in to refresh session details.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to update account.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell role="admin" title="Account settings" eyebrow="Profile">
      <section className="mb-8 max-w-3xl">
        <p className="page-kicker">Studio identity</p>
        <h2 className="editorial-title mt-3">Keep your access polished and secure.</h2>
        <p className="mt-4 max-w-xl text-sm leading-6 text-muted">
          Update your admin profile details and rotate your password when needed.
        </p>
      </section>

      <Card className="max-w-3xl overflow-hidden bg-surface/80 shadow-2xl shadow-black/20 backdrop-blur-xl">
        <div className="border-b border-line p-6">
          <h3 className="font-serif text-3xl font-light">Profile</h3>
          <p className="mt-2 text-sm text-muted">These details are used inside the admin workspace.</p>
        </div>

        <div className="grid gap-5 p-6">
          <label className="block">
            <span className="mb-2 flex items-center gap-2 text-sm text-zinc-400">
              <UserRound size={15} /> Name
            </span>
            <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" />
          </label>

          <label className="block">
            <span className="mb-2 flex items-center gap-2 text-sm text-zinc-400">
              <Mail size={15} /> Email
            </span>
            <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
          </label>

          <div className="thin-divider" />

          <label className="block">
            <span className="mb-2 flex items-center gap-2 text-sm text-zinc-400">
              <KeyRound size={15} /> Current password
            </span>
            <Input
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              placeholder="Required only when changing password"
            />
          </label>

          <label className="block">
            <span className="mb-2 flex items-center gap-2 text-sm text-zinc-400">
              <KeyRound size={15} /> New password
            </span>
            <Input
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              placeholder="At least 8 characters"
            />
          </label>

          {message && <p className="rounded-2xl border border-emerald-300/20 bg-emerald-300/10 px-4 py-3 text-sm text-emerald-200">{message}</p>}
          {error && <p className="rounded-2xl border border-red-300/20 bg-red-300/10 px-4 py-3 text-sm text-red-200">{error}</p>}

          <div className="flex justify-end">
            <Button onClick={saveAccount} disabled={saving}>
              {saving ? "Saving..." : "Save settings"}
            </Button>
          </div>
        </div>
      </Card>
    </AppShell>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions);
  if (!session || session.user?.role !== "ADMIN" || !session.user.id) {
    return { redirect: { destination: "/login", permanent: false } };
  }

  const account = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true },
  });

  if (!account) {
    return { redirect: { destination: "/login", permanent: false } };
  }

  return { props: { account } };
};
