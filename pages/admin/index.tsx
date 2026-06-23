import { GetServerSideProps } from "next";
import Link from "next/link";
import { useState } from "react";
import { getServerSession } from "next-auth";
import { Camera, FolderOpen, LayoutTemplate, UserPlus, Users } from "lucide-react";
import { authOptions } from "../api/auth/[...nextauth]";
import { prisma } from "../../lib/prisma";
import { readApiJson } from "../../lib/clientApi";
import { AppShell } from "../../components/AppShell";
import { StatusBadge } from "../../components/StatusBadge";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Card } from "../../components/ui/card";
import { EmptyState } from "../../components/EmptyState";
import { BrandMark } from "../../components/BrandMark";

type AdminProps = {
  users: { id: string; email: string; name: string | null; role: string }[];
  projects: { id: string; title: string; status: string; clientEmail: string; createdAt: string }[];
  layouts: { id: string; name: string; orientation: string }[];
};

export default function AdminDashboard({ users, projects, layouts }: AdminProps) {
  const [clients, setClients] = useState(users);
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [creatingClient, setCreatingClient] = useState(false);
  const [clientError, setClientError] = useState("");
  const [clientSuccess, setClientSuccess] = useState("");

  const createClient = async () => {
    if (!newEmail.trim() || !newPassword) {
      setClientSuccess("");
      setClientError("Enter a client email and temporary password.");
      return;
    }

    setCreatingClient(true);
    setClientError("");
    setClientSuccess("");

    try {
      const res = await fetch("/api/admin/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newEmail, name: newName, password: newPassword }),
      });
      const data = await readApiJson<{ id: string; email: string; name: string | null }>(
        res,
        "Unable to create client right now.",
      );

      setClients((prev) => [
        ...prev,
        { id: data.id, email: data.email, name: data.name, role: "CLIENT" },
      ]);
      setNewEmail("");
      setNewName("");
      setNewPassword("");
      setClientSuccess("Client created successfully.");
    } catch (error) {
      setClientError(error instanceof Error ? error.message : "Unable to create client right now.");
    } finally {
      setCreatingClient(false);
    }
  };

  const stats = [
    { label: "Clients", value: clients.length, icon: Users },
    { label: "Projects", value: projects.length, icon: FolderOpen },
    { label: "Layouts", value: layouts.length, icon: LayoutTemplate },
  ];

  return (
    <AppShell
      role="admin"
      title="Studio overview"
      eyebrow="Admin"
      actions={
        <Link href="/admin/projects/new">
          <Button>
            <Camera size={16} />
            New project
          </Button>
        </Link>
      }
    >
      <section className="mb-8 grid gap-6 lg:grid-cols-[minmax(0,0.7fr)_minmax(280px,0.3fr)]">
        <div>
          <BrandMark className="mb-8" />
          <p className="page-kicker">Operational command</p>
          <h2 className="editorial-title mt-3">A quieter way to manage client galleries.</h2>
        </div>
        <p className="self-end text-sm leading-6 text-muted">
          Track active sessions, prepare selections, and keep client delivery moving from one refined workspace.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted">{stat.label}</p>
                <Icon size={18} className="text-champagne" />
              </div>
              <p className="mt-5 font-serif text-5xl font-light">{stat.value}</p>
            </Card>
          );
        })}
      </section>

      <section className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,0.62fr)_minmax(360px,0.38fr)]">
        <Card className="p-5">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="page-kicker">Recent activity</p>
              <h3 className="mt-1 font-serif text-3xl font-light">Client projects</h3>
            </div>
            <Link href="/admin/projects" className="text-sm text-muted hover:text-white">
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {projects.map((project) => (
              <Link
                key={project.id}
                href={`/admin/projects/${project.id}`}
                className="block rounded-3xl border border-line bg-black/20 px-4 py-4 transition hover:border-brand-red/60"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-white">{project.title}</p>
                    <p className="mt-1 text-sm text-muted">{project.clientEmail}</p>
                  </div>
                  <StatusBadge status={project.status} />
                </div>
              </Link>
            ))}
            {projects.length === 0 && (
              <EmptyState
                title="No projects yet"
                description="Create your first client project to begin uploading images."
                actionLabel="New project"
                href="/admin/projects/new"
              />
            )}
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="p-5">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="page-kicker">Layouts</p>
                <h3 className="mt-1 font-serif text-3xl font-light">Templates</h3>
              </div>
              <Link href="/admin/layouts" className="text-sm text-muted hover:text-white">
                Manage
              </Link>
            </div>
            <div className="space-y-3">
              {layouts.map((layout) => (
                <div key={layout.id} className="rounded-2xl border border-line bg-black/20 px-4 py-3">
                  <p className="font-medium">{layout.name}</p>
                  <p className="text-sm text-muted">{layout.orientation}</p>
                </div>
              ))}
              {layouts.length === 0 && <p className="text-sm text-muted">No layouts uploaded yet.</p>}
            </div>
          </Card>

          <Card className="p-5">
            <div className="mb-5 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-champagne">
                <UserPlus size={18} />
              </span>
              <div>
                <p className="page-kicker">Clients</p>
                <h3 className="font-serif text-3xl font-light">Invite client</h3>
              </div>
            </div>
            <div className="space-y-3">
              <Input placeholder="Client name" value={newName} onChange={(event) => setNewName(event.target.value)} />
              <Input placeholder="Client email" value={newEmail} onChange={(event) => setNewEmail(event.target.value)} />
              <Input
                placeholder="Temporary password"
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
              />
              <Button onClick={createClient} disabled={creatingClient} className="w-full">
                {creatingClient ? "Adding client..." : "Add client"}
              </Button>
              {clientError && <p className="text-sm text-red-300">{clientError}</p>}
              {clientSuccess && <p className="text-sm text-emerald-300">{clientSuccess}</p>}
            </div>
          </Card>
        </div>
      </section>
    </AppShell>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions);
  if (!session || session.user?.role !== "ADMIN") {
    return {
      redirect: { destination: "/login", permanent: false },
    };
  }

  const users = await prisma.user.findMany({
    where: { role: "CLIENT" },
    select: { id: true, email: true, name: true, role: true },
  });
  const projects = await prisma.clientProject.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    include: { client: true },
  });
  const layouts = await prisma.bookLayout.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
  });

  return {
    props: {
      users,
      projects: projects.map((project) => ({
        id: project.id,
        title: project.title,
        status: project.status,
        clientEmail: project.client.email,
        createdAt: project.createdAt.toISOString(),
      })),
      layouts: layouts.map((layout) => ({
        id: layout.id,
        name: layout.name,
        orientation: layout.orientation,
      })),
    },
  };
};
