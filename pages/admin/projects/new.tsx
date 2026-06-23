import { GetServerSideProps } from "next";
import { useState } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "../../api/auth/[...nextauth]";
import { prisma } from "../../../lib/prisma";
import { useRouter } from "next/router";
import { readApiJson } from "../../../lib/clientApi";
import { AppShell } from "../../../components/AppShell";
import { Card } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Textarea } from "../../../components/ui/textarea";
import { Select } from "../../../components/ui/select";

type Props = {
  clients: { id: string; email: string; name: string | null }[];
};

export default function NewProjectPage({ clients }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [clientId, setClientId] = useState(clients[0]?.id || "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = async () => {
    if (!title.trim() || !clientId) {
      setError("Enter a project title and choose a client.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/admin/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, clientId }),
      });
      const data = await readApiJson<{ id: string }>(res, "Unable to create project right now.");
      router.push(`/admin/projects/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create project right now.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell role="admin" title="New project" eyebrow="Admin">
      <div className="mx-auto max-w-3xl">
        <p className="page-kicker">Create session</p>
        <h2 className="editorial-title mt-3">Prepare a client gallery.</h2>

        <Card className="mt-8 p-5 md:p-7">
          <div className="space-y-5">
            <label className="block">
              <span className="mb-2 block text-sm text-muted">Title</span>
              <Input value={title} onChange={(event) => setTitle(event.target.value)} />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm text-muted">Description</span>
              <Textarea value={description} onChange={(event) => setDescription(event.target.value)} />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm text-muted">Client</span>
              <Select
                value={clientId}
                onChange={(event) => setClientId(event.target.value)}
                disabled={clients.length === 0 || submitting}
              >
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name ? `${client.name} · ${client.email}` : client.email}
                  </option>
                ))}
              </Select>
            </label>
            {clients.length === 0 && (
              <p className="text-sm text-amber-200">Create a client first before opening a new project.</p>
            )}
            {error && <p className="text-sm text-red-300">{error}</p>}
            <Button onClick={handleCreate} disabled={submitting || clients.length === 0}>
              {submitting ? "Creating project..." : "Create project"}
            </Button>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions);
  if (!session || session.user?.role !== "ADMIN") {
    return { redirect: { destination: "/login", permanent: false } };
  }

  const clients = await prisma.user.findMany({
    where: { role: "CLIENT" },
    select: { id: true, email: true, name: true },
    orderBy: { createdAt: "desc" },
  });

  return { props: { clients } };
};
