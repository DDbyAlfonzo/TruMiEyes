import { GetServerSideProps } from "next";
import { useEffect, useMemo, useState } from "react";
import { getServerSession } from "next-auth";
import { Copy, KeyRound, ShieldCheck, UserPlus, Users } from "lucide-react";
import { authOptions } from "../api/auth/[...nextauth]";
import { prisma } from "../../lib/prisma";
import { readApiJson } from "../../lib/clientApi";
import { AppShell } from "../../components/AppShell";
import { StatusBadge } from "../../components/StatusBadge";
import { Card } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Select } from "../../components/ui/select";
import { Button } from "../../components/ui/button";

type TeamUser = {
  id: string;
  name: string | null;
  email: string;
  role: "ADMIN" | "CLIENT";
  active: boolean;
  createdAt: string;
};

type UsersProps = {
  users: TeamUser[];
  currentUserId: string;
};

function generateTemporaryPassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*";
  if (typeof window !== "undefined" && window.crypto?.getRandomValues) {
    const values = window.crypto.getRandomValues(new Uint32Array(18));
    return Array.from(values, (value) => chars[value % chars.length]).join("");
  }
  return Array.from({ length: 18 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

export default function AdminUsersPage({ users: initialUsers, currentUserId }: UsersProps) {
  const [users, setUsers] = useState(initialUsers);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"ADMIN" | "CLIENT">("CLIENT");
  const [password, setPassword] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [workingUserId, setWorkingUserId] = useState("");
  const [creating, setCreating] = useState(false);

  const counts = useMemo(() => ({
    total: users.length,
    active: users.filter((user) => user.active).length,
    admins: users.filter((user) => user.role === "ADMIN").length,
  }), [users]);

  useEffect(() => {
    setPassword(generateTemporaryPassword());
  }, []);

  const copyText = async (value: string) => {
    await navigator.clipboard.writeText(value);
    setNotice("Temporary password copied.");
  };

  const createUser = async () => {
    setCreating(true);
    setNotice("");
    setError("");

    try {
      const created = await readApiJson<TeamUser & { temporaryPassword: string }>(
        await fetch("/api/admin/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, role, password }),
        }),
        "Unable to create user.",
      );
      setUsers((current) => [created, ...current]);
      setName("");
      setEmail("");
      setRole("CLIENT");
      setPassword(generateTemporaryPassword());
      setNotice(`Created ${created.email}. Temporary password: ${created.temporaryPassword}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to create user.");
    } finally {
      setCreating(false);
    }
  };

  const updateUser = async (id: string, updates: Partial<Pick<TeamUser, "active" | "role">>) => {
    setWorkingUserId(id);
    setNotice("");
    setError("");

    try {
      const updated = await readApiJson<TeamUser>(
        await fetch(`/api/admin/users/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updates),
        }),
        "Unable to update user.",
      );
      setUsers((current) => current.map((user) => (user.id === id ? updated : user)));
      setNotice("User updated.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to update user.");
    } finally {
      setWorkingUserId("");
    }
  };

  const resetPassword = async (id: string) => {
    setWorkingUserId(id);
    setNotice("");
    setError("");

    try {
      const result = await readApiJson<{ temporaryPassword: string }>(
        await fetch(`/api/admin/users/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "reset-password" }),
        }),
        "Unable to reset password.",
      );
      setUsers((current) => current.map((user) => (user.id === id ? { ...user, active: true } : user)));
      setNotice(`Temporary password: ${result.temporaryPassword}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to reset password.");
    } finally {
      setWorkingUserId("");
    }
  };

  const deleteUser = async (id: string) => {
    setWorkingUserId(id);
    setNotice("");
    setError("");

    try {
      const result = await readApiJson<{ deleted: boolean; user?: TeamUser; message?: string }>(
        await fetch(`/api/admin/users/${id}`, { method: "DELETE" }),
        "Unable to delete user.",
      );
      if (result.deleted) {
        setUsers((current) => current.filter((user) => user.id !== id));
        setNotice("User deleted.");
      } else if (result.user) {
        setUsers((current) => current.map((user) => (user.id === id ? result.user! : user)));
        setNotice(result.message || "User deactivated.");
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to delete user.");
    } finally {
      setWorkingUserId("");
    }
  };

  return (
    <AppShell role="admin" title="Users & team" eyebrow="Admin">
      <section className="mb-8 grid gap-6 lg:grid-cols-[minmax(0,0.68fr)_minmax(320px,0.32fr)]">
        <div>
          <p className="page-kicker">Team access</p>
          <h2 className="editorial-title mt-3">Manage who can enter the studio.</h2>
          <p className="mt-4 max-w-xl text-sm leading-6 text-muted">
            Create teammates, invite clients, reset temporary access, and keep inactive accounts out of the portal.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
          <Card className="bg-black/25 p-4 backdrop-blur">
            <p className="text-sm text-muted">Users</p>
            <p className="mt-2 font-serif text-4xl font-light">{counts.total}</p>
          </Card>
          <Card className="bg-black/25 p-4 backdrop-blur">
            <p className="text-sm text-muted">Active</p>
            <p className="mt-2 font-serif text-4xl font-light">{counts.active}</p>
          </Card>
          <Card className="bg-black/25 p-4 backdrop-blur">
            <p className="text-sm text-muted">Admins</p>
            <p className="mt-2 font-serif text-4xl font-light">{counts.admins}</p>
          </Card>
        </div>
      </section>

      {(notice || error) && (
        <div className="mb-6 rounded-3xl border border-white/10 bg-black/30 p-4 backdrop-blur-xl">
          {notice && <p className="text-sm text-emerald-200">{notice}</p>}
          {error && <p className="text-sm text-red-200">{error}</p>}
        </div>
      )}

      <section className="grid gap-6 xl:grid-cols-[minmax(0,0.62fr)_minmax(360px,0.38fr)]">
        <Card className="overflow-hidden bg-surface/80 shadow-2xl shadow-black/20 backdrop-blur-xl">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-5">
            <div>
              <p className="page-kicker">Directory</p>
              <h3 className="mt-1 font-serif text-3xl font-light">Team members</h3>
            </div>
            <Users className="text-brand-red" size={22} />
          </div>

          <div className="divide-y divide-line">
            {users.map((user) => (
              <article key={user.id} className="grid gap-4 p-5 lg:grid-cols-[minmax(0,1fr)_auto]">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-red/90 text-sm font-semibold uppercase">
                      {(user.name || user.email)[0]}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-white">{user.name || "Unnamed user"}</p>
                      <p className="truncate text-sm text-muted">{user.email}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <StatusBadge status={user.role} />
                    <StatusBadge status={user.active ? "ACTIVE" : "INACTIVE"} />
                    {user.id === currentUserId && <span className="rounded-full border border-champagne/40 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-champagne">You</span>}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                  <Select
                    value={user.role}
                    onChange={(event) => updateUser(user.id, { role: event.target.value as TeamUser["role"] })}
                    disabled={workingUserId === user.id}
                    className="h-10 w-32 py-2"
                  >
                    <option value="ADMIN">Admin</option>
                    <option value="CLIENT">Client</option>
                  </Select>
                  <Button
                    variant={user.active ? "outline" : "secondary"}
                    size="sm"
                    onClick={() => updateUser(user.id, { active: !user.active })}
                    disabled={workingUserId === user.id || user.id === currentUserId}
                  >
                    {user.active ? "Deactivate" : "Activate"}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => resetPassword(user.id)} disabled={workingUserId === user.id}>
                    <KeyRound size={15} />
                    Reset
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => deleteUser(user.id)} disabled={workingUserId === user.id || user.id === currentUserId}>
                    Delete
                  </Button>
                </div>
              </article>
            ))}
          </div>
        </Card>

        <Card className="h-fit bg-surface/80 p-5 shadow-2xl shadow-black/20 backdrop-blur-xl">
          <div className="mb-5 flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-red text-white">
              <UserPlus size={19} />
            </span>
            <div>
              <p className="page-kicker">Access</p>
              <h3 className="font-serif text-3xl font-light">Add user</h3>
            </div>
          </div>

          <div className="space-y-3">
            <Input placeholder="Name" value={name} onChange={(event) => setName(event.target.value)} />
            <Input type="email" placeholder="Email" value={email} onChange={(event) => setEmail(event.target.value)} />
            <Select value={role} onChange={(event) => setRole(event.target.value as TeamUser["role"])}>
              <option value="CLIENT">Client</option>
              <option value="ADMIN">Admin</option>
            </Select>
            <div className="flex gap-2">
              <Input value={password} onChange={(event) => setPassword(event.target.value)} />
              <Button variant="secondary" size="icon" onClick={() => setPassword(generateTemporaryPassword())} aria-label="Generate password">
                <ShieldCheck size={17} />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => copyText(password)} aria-label="Copy password">
                <Copy size={17} />
              </Button>
            </div>
            <Button className="w-full" onClick={createUser} disabled={creating}>
              {creating ? "Creating..." : "Create user"}
            </Button>
          </div>
        </Card>
      </section>
    </AppShell>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions);
  if (!session || session.user?.role !== "ADMIN" || !session.user.id) {
    return { redirect: { destination: "/login", permanent: false } };
  }

  const users = await prisma.user.findMany({
    orderBy: [{ role: "asc" }, { createdAt: "desc" }],
    select: { id: true, name: true, email: true, role: true, active: true, createdAt: true },
  });

  return {
    props: {
      currentUserId: session.user.id,
      users: users.map((user) => ({ ...user, createdAt: user.createdAt.toISOString() })),
    },
  };
};
