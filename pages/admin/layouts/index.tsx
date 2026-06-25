import { GetServerSideProps } from "next";
import { useState } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "../../api/auth/[...nextauth]";
import { prisma } from "../../../lib/prisma";
import { readApiJson } from "../../../lib/clientApi";
import { getDisplayUrl } from "../../../lib/storage";
import { uploadFileWithProgress } from "../../../lib/uploadClient";
import { AppShell } from "../../../components/AppShell";
import { Card } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { Select } from "../../../components/ui/select";
import { Button } from "../../../components/ui/button";
import { UploadDropzone } from "../../../components/UploadDropzone";
import { EmptyState } from "../../../components/EmptyState";
import { ImageWithFallback } from "../../../components/ImageWithFallback";

type Layout = {
  id: string;
  name: string;
  description: string | null;
  previewImageUrl: string;
  pageCount: number;
  orientation: string;
};

type Props = {
  layouts: Layout[];
};

export default function LayoutsPage({ layouts }: Props) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [pageCount, setPageCount] = useState(20);
  const [orientation, setOrientation] = useState("PORTRAIT");
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async () => {
    if (!name.trim() || !file) {
      setSuccess("");
      setError("Enter a layout name and choose a preview image first.");
      return;
    }

    setSaving(true);
    setUploadProgress(0);
    setError("");
    setSuccess("");

    try {
      const uploadData = await uploadFileWithProgress(file, setUploadProgress);

      await readApiJson(
        await fetch("/api/admin/layouts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            description,
            pageCount,
            orientation,
            previewImagePath: uploadData.path,
          }),
        }),
        "Unable to save the layout right now.",
      );

      setSuccess("Layout saved. Refreshing the gallery...");
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save the layout right now.");
    } finally {
      setUploadProgress(null);
      setSaving(false);
    }
  };

  return (
    <AppShell role="admin" title="Book layouts" eyebrow="Admin">
      <div className="mb-8">
        <p className="page-kicker">Album design</p>
        <h2 className="editorial-title mt-3">Layout library.</h2>
      </div>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,0.45fr)_minmax(0,0.55fr)]">
        <Card className="p-5">
          <h3 className="font-serif text-3xl font-light">Upload layout</h3>
          <div className="mt-5 space-y-4">
            <Input placeholder="Layout name" value={name} onChange={(event) => setName(event.target.value)} />
            <Input placeholder="Page count" type="number" value={pageCount} onChange={(event) => setPageCount(Number(event.target.value))} />
            <Input placeholder="Description" value={description} onChange={(event) => setDescription(event.target.value)} />
            <Select value={orientation} onChange={(event) => setOrientation(event.target.value)}>
              <option value="PORTRAIT">Portrait</option>
              <option value="LANDSCAPE">Landscape</option>
              <option value="SQUARE">Square</option>
            </Select>
            <UploadDropzone
              onFile={setFile}
              onReject={(message) => {
                setSuccess("");
                setError(message);
              }}
              disabled={saving}
              label={saving ? "Uploading preview..." : file ? file.name : "Drop layout preview"}
              progress={uploadProgress}
            />
            {error && <p className="text-sm text-red-300">{error}</p>}
            {success && <p className="text-sm text-emerald-300">{success}</p>}
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? "Saving layout..." : "Save layout"}
            </Button>
          </div>
        </Card>

        <div>
          {layouts.length === 0 ? (
            <EmptyState
              title="No layouts uploaded yet"
              description="Add preview templates so clients can choose their preferred album direction."
            />
          ) : (
            <section className="grid gap-4 sm:grid-cols-2">
              {layouts.map((layout) => (
                <article key={layout.id} className="overflow-hidden rounded-3xl border border-line bg-surface">
                  <ImageWithFallback
                    src={layout.previewImageUrl}
                    alt={layout.name}
                    className="aspect-[4/3] w-full object-cover"
                  />
                  <div className="p-4">
                    <h3 className="font-medium">{layout.name}</h3>
                    <p className="mt-1 text-sm text-muted">
                      {layout.orientation} · {layout.pageCount} pages
                    </p>
                  </div>
                </article>
              ))}
            </section>
          )}
        </div>
      </section>
    </AppShell>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions);
  if (!session || session.user?.role !== "ADMIN") {
    return { redirect: { destination: "/login", permanent: false } };
  }

  const layouts = await prisma.bookLayout.findMany({ orderBy: { createdAt: "desc" } });
  const withUrls = await Promise.all(
    layouts.map(async (layout) => ({
      id: layout.id,
      name: layout.name,
      description: layout.description,
      previewImageUrl: await getDisplayUrl(layout.previewImagePath, "/bg.jpg"),
      pageCount: layout.pageCount,
      orientation: layout.orientation,
    })),
  );
  return { props: { layouts: withUrls } };
};
