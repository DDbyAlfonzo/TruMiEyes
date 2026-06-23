import { GetServerSideProps } from "next";
import { useState } from "react";
import { getServerSession } from "next-auth";
import { Eye, Heart, Mail, Save } from "lucide-react";
import { authOptions } from "../../api/auth/[...nextauth]";
import { prisma } from "../../../lib/prisma";
import { readApiJson } from "../../../lib/clientApi";
import { getDisplayUrl } from "../../../lib/storage";
import { AppShell } from "../../../components/AppShell";
import { StatusBadge } from "../../../components/StatusBadge";
import { UploadDropzone } from "../../../components/UploadDropzone";
import { CommentPanel } from "../../../components/CommentPanel";
import { EmptyState } from "../../../components/EmptyState";
import { ImageWithFallback } from "../../../components/ImageWithFallback";
import { BrandMark } from "../../../components/BrandMark";
import { Card } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Select } from "../../../components/ui/select";
import { Textarea } from "../../../components/ui/textarea";

type ProjectPageProps = {
  project: {
    id: string;
    title: string;
    description: string | null;
    status: string;
    clientEmail: string;
    requestMessage: string | null;
  };
  layouts: { id: string; name: string; previewImageUrl: string; orientation: string }[];
  assignedLayouts: string[];
  images: {
    id: string;
    imageUrl: string;
    filename: string;
    downloadable: boolean;
    status: string;
    favoriteCount: number;
    comments: { id: string; message: string; createdAt: string; userEmail: string }[];
  }[];
  selection?: {
    id: string;
    selectedLayoutName: string | null;
    notes: string | null;
    selectedImages: { id: string; imageUrl: string }[];
    approvalStatus: string;
  } | null;
  favoriteImages: { id: string; imageUrl: string; filename: string }[];
  requestHistory: { id: string; message: string; createdAt: string; authorEmail: string }[];
};

export default function AdminProjectPage({
  project,
  layouts,
  assignedLayouts,
  images,
  selection,
  favoriteImages,
  requestHistory,
}: ProjectPageProps) {
  const [status, setStatus] = useState(project.status);
  const [layoutIds, setLayoutIds] = useState(new Set(assignedLayouts));
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [warningMessage, setWarningMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [requestMessage, setRequestMessage] = useState(project.requestMessage || "");
  const [approvalStatus, setApprovalStatus] = useState(selection?.approvalStatus || "PENDING");
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [imageSettings, setImageSettings] = useState(
    Object.fromEntries(
      images.map((image) => [
        image.id,
        { status: image.status, downloadable: image.downloadable },
      ]),
    ),
  );

  const busy = activeAction !== null;
  const clearFeedback = () => {
    setSuccessMessage("");
    setWarningMessage("");
    setErrorMessage("");
  };

  const setActionFeedback = (success: string, warning?: string | null) => {
    setSuccessMessage(success);
    setWarningMessage(warning || "");
    setErrorMessage("");
  };

  const toggleLayout = (layoutId: string) => {
    setLayoutIds((prev) => {
      const next = new Set(prev);
      if (next.has(layoutId)) next.delete(layoutId);
      else next.add(layoutId);
      return next;
    });
  };

  const saveLayouts = async () => {
    clearFeedback();
    setActiveAction("layouts");
    try {
      await readApiJson(
        await fetch("/api/admin/project-layouts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ projectId: project.id, layoutIds: Array.from(layoutIds) }),
        }),
        "Unable to update layouts right now.",
      );
      setActionFeedback("Layouts updated.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to update layouts right now.");
    } finally {
      setActiveAction(null);
    }
  };

  const updateStatus = async () => {
    clearFeedback();
    setActiveAction("status");
    try {
      const data = await readApiJson<{ warning?: string | null }>(
        await fetch("/api/admin/project-status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ projectId: project.id, status, requestMessage }),
        }),
        "Unable to update the project status right now.",
      );
      setActionFeedback("Status updated.", data.warning);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to update the project status right now.",
      );
    } finally {
      setActiveAction(null);
    }
  };

  const requestChanges = async () => {
    if (!requestMessage.trim()) {
      clearFeedback();
      setErrorMessage("Add a message before requesting changes.");
      return;
    }

    clearFeedback();
    setActiveAction("request-changes");
    try {
      const data = await readApiJson<{ warning?: string | null }>(
        await fetch("/api/admin/project-status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectId: project.id,
            status: "IN_REVIEW",
            requestMessage,
          }),
        }),
        "Unable to send the change request right now.",
      );
      setStatus("IN_REVIEW");
      setShowRequestModal(false);
      setActionFeedback("Request sent to client.", data.warning);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to send the change request right now.",
      );
    } finally {
      setActiveAction(null);
    }
  };

  const updateSelectionStatus = async () => {
    if (!selection?.id) return;
    clearFeedback();
    setActiveAction("selection-status");
    try {
      const data = await readApiJson<{ warning?: string | null }>(
        await fetch("/api/admin/selection-status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            selectionId: selection.id,
            approvalStatus,
            projectStatus: approvalStatus === "APPROVED" ? "APPROVED" : "IN_REVIEW",
            requestMessage: requestMessage || null,
          }),
        }),
        "Unable to update the selection status right now.",
      );
      setStatus(approvalStatus === "APPROVED" ? "APPROVED" : "IN_REVIEW");
      setActionFeedback("Selection status updated.", data.warning);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to update the selection status right now.",
      );
    } finally {
      setActiveAction(null);
    }
  };

  const reopenForEdits = async () => {
    if (!selection?.id) return;
    clearFeedback();
    setActiveAction("reopen");
    try {
      const data = await readApiJson<{ warning?: string | null }>(
        await fetch("/api/admin/selection-status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            selectionId: selection.id,
            approvalStatus: "PENDING",
            projectStatus: "IN_REVIEW",
            requestMessage: requestMessage || null,
          }),
        }),
        "Unable to reopen the project for edits right now.",
      );
      setApprovalStatus("PENDING");
      setStatus("IN_REVIEW");
      setActionFeedback("Project reopened for edits.", data.warning);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to reopen the project for edits right now.",
      );
    } finally {
      setActiveAction(null);
    }
  };

  const handleImageUpload = async (file: File) => {
    clearFeedback();
    setActiveAction("upload");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const uploadData = await readApiJson<{ path: string; filename: string }>(
        await fetch("/api/upload", { method: "POST", body: formData }),
        "Unable to upload the image right now.",
      );
      await readApiJson(
        await fetch("/api/admin/images", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectId: project.id,
            imagePath: uploadData.path,
            filename: uploadData.filename || file.name,
          }),
        }),
        "Unable to attach the uploaded image to this project.",
      );
      setActionFeedback("Image uploaded. Refreshing the gallery...");
      window.location.reload();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to upload the image right now.");
    } finally {
      setActiveAction(null);
    }
  };

  const saveImageSettings = async (photoId: string) => {
    const settings = imageSettings[photoId];
    if (!settings) return;
    clearFeedback();
    setActiveAction(`image:${photoId}`);
    try {
      await readApiJson(
        await fetch("/api/admin/image-status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            photoId,
            status: settings.status,
            downloadable: settings.downloadable,
          }),
        }),
        "Unable to update this image right now.",
      );
      setActionFeedback("Image updated.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to update this image right now.");
    } finally {
      setActiveAction(null);
    }
  };

  return (
    <AppShell
      role="admin"
      title={project.title}
      eyebrow="Project"
      actions={
        <Button variant="outline" onClick={() => setShowRequestModal(true)} disabled={busy}>
          <Mail size={16} />
          Request changes
        </Button>
      }
    >
      <div className="space-y-8">
        <header className="relative overflow-hidden rounded-3xl border border-line bg-surface">
          <ImageWithFallback
            src={images[0]?.imageUrl || "/bg.jpg"}
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-25"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-background/30" />
          <div className="relative grid gap-6 px-5 py-10 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.35fr)] lg:px-8">
            <div>
              <BrandMark className="mb-8" />
              <p className="page-kicker">{project.clientEmail}</p>
              <h1 className="editorial-title mt-3">{project.title}</h1>
              {project.description && <p className="mt-4 max-w-2xl text-muted">{project.description}</p>}
              <div className="mt-5 flex flex-wrap gap-2">
                <StatusBadge status={status} />
                <span className="rounded-full border border-line px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-zinc-400">
                  {images.length} images
                </span>
                <span className="rounded-full border border-line px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-zinc-400">
                  {favoriteImages.length} favourites
                </span>
              </div>
            </div>
            <Card className="bg-black/30 p-4">
              <p className="page-kicker">Project status</p>
              <div className="mt-4 space-y-3">
                <Select value={status} onChange={(event) => setStatus(event.target.value)} disabled={busy}>
                  {["DRAFT", "SHARED", "IN_REVIEW", "APPROVED", "COMPLETED"].map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </Select>
                <Button onClick={updateStatus} disabled={busy} className="w-full">
                  <Save size={16} />
                  {activeAction === "status" ? "Saving..." : "Save status"}
                </Button>
              </div>
            </Card>
          </div>
        </header>

        {showRequestModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-5">
            <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={() => setShowRequestModal(false)} />
            <Card className="relative z-10 w-full max-w-xl p-6">
              <h3 className="font-serif text-3xl font-light">Request changes</h3>
              <p className="mt-2 text-sm text-muted">
                Let the client know what to update. This will move the project to IN_REVIEW.
              </p>
              <Textarea
                className="mt-5"
                value={requestMessage}
                onChange={(event) => setRequestMessage(event.target.value)}
                placeholder="Tell the client what to adjust..."
                disabled={activeAction === "request-changes"}
              />
              <div className="mt-4 flex justify-end gap-3">
                <Button variant="ghost" onClick={() => setShowRequestModal(false)} disabled={activeAction === "request-changes"}>
                  Cancel
                </Button>
                <Button onClick={requestChanges} disabled={activeAction === "request-changes"}>
                  {activeAction === "request-changes" ? "Sending..." : "Send request"}
                </Button>
              </div>
            </Card>
          </div>
        )}

        {(successMessage || warningMessage || errorMessage) && (
          <div className="space-y-2">
            {successMessage && <p className="text-sm text-emerald-300">{successMessage}</p>}
            {warningMessage && <p className="text-sm text-amber-200">{warningMessage}</p>}
            {errorMessage && <p className="text-sm text-red-300">{errorMessage}</p>}
          </div>
        )}

        <section className="grid gap-6 xl:grid-cols-[minmax(0,0.36fr)_minmax(0,0.64fr)]">
          <div className="space-y-6">
            <Card className="p-5">
              <h2 className="font-serif text-3xl font-light">Assign layouts</h2>
              <div className="mt-5 space-y-3">
                {layouts.map((layout) => (
                  <button
                    key={layout.id}
                    onClick={() => toggleLayout(layout.id)}
                    disabled={busy}
                    aria-label={`Toggle layout ${layout.name}`}
                    className={`flex w-full gap-3 border p-3 text-left transition ${
                      layoutIds.has(layout.id) ? "border-brand-red" : "border-line hover:border-brand-red/60"
                    }`}
                  >
                    <ImageWithFallback src={layout.previewImageUrl} alt={layout.name} className="h-20 w-24 object-cover" />
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{layout.name}</span>
                      <span className="text-sm text-muted">{layout.orientation}</span>
                    </span>
                  </button>
                ))}
              </div>
              <Button variant="outline" className="mt-4 w-full" onClick={saveLayouts} disabled={busy}>
                {activeAction === "layouts" ? "Saving layouts..." : "Save layout assignments"}
              </Button>
            </Card>

            <Card className="p-5">
              <h2 className="font-serif text-3xl font-light">Upload images</h2>
              <p className="mt-2 text-sm text-muted">Add photographs to this project gallery.</p>
              <div className="mt-5">
                <UploadDropzone
                  onFile={handleImageUpload}
                  onReject={(message) => {
                    clearFeedback();
                    setErrorMessage(message);
                  }}
                  disabled={busy}
                  label={activeAction === "upload" ? "Uploading..." : "Drop project image"}
                />
              </div>
            </Card>
          </div>

          <Card className="p-5">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="page-kicker">Image controls</p>
                <h2 className="font-serif text-3xl font-light">Project images</h2>
              </div>
            </div>
            {images.length === 0 ? (
              <EmptyState title="No images yet" description="Upload photographs to begin preparing the client gallery." />
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {images.map((image) => (
                  <article key={image.id} className="overflow-hidden rounded-3xl border border-line bg-black/20">
                    <ImageWithFallback src={image.imageUrl} alt={image.filename} className="aspect-[4/3] w-full object-cover" />
                    <div className="space-y-4 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-medium">{image.filename}</p>
                          <p className="mt-1 flex items-center gap-1 text-sm text-muted">
                            <Heart size={14} /> {image.favoriteCount} favourites
                          </p>
                        </div>
                        <StatusBadge status={imageSettings[image.id]?.status || image.status} />
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Select
                          className="h-10 w-auto py-2"
                          value={imageSettings[image.id]?.status || image.status}
                          onChange={(event) =>
                            setImageSettings((prev) => ({
                              ...prev,
                              [image.id]: {
                                ...prev[image.id],
                                status: event.target.value,
                                downloadable: prev[image.id]?.downloadable ?? image.downloadable,
                              },
                            }))
                          }
                          disabled={busy}
                        >
                          <option value="HIDDEN">hidden</option>
                          <option value="CLIENT_REVIEW">client_review</option>
                          <option value="APPROVED">approved</option>
                        </Select>
                        <label className="inline-flex h-10 items-center gap-2 rounded-full border border-line px-3 text-sm text-zinc-300">
                          <input
                            type="checkbox"
                            checked={imageSettings[image.id]?.downloadable ?? image.downloadable}
                            onChange={(event) =>
                              setImageSettings((prev) => ({
                                ...prev,
                                [image.id]: {
                                  status: prev[image.id]?.status || image.status,
                                  downloadable: event.target.checked,
                                },
                              }))
                            }
                            disabled={busy}
                          />
                          Download
                        </label>
                        <Button variant="outline" size="sm" onClick={() => saveImageSettings(image.id)} disabled={busy}>
                          {activeAction === `image:${image.id}` ? "Saving..." : "Save"}
                        </Button>
                      </div>
                      <div className="thin-divider pt-4">
                        <p className="mb-3 text-[11px] uppercase tracking-[0.2em] text-zinc-500">Comments</p>
                        {image.comments.length === 0 ? (
                          <p className="text-sm text-muted">No comments for this image.</p>
                        ) : (
                          <CommentPanel comments={image.comments} />
                        )}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </Card>
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <Card className="p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="page-kicker">Client choices</p>
                <h2 className="font-serif text-3xl font-light">Current favourites</h2>
              </div>
              <span className="text-sm text-muted">{favoriteImages.length} selected</span>
            </div>
            {favoriteImages.length === 0 ? (
              <p className="mt-5 text-sm text-muted">No favourites selected yet.</p>
            ) : (
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {favoriteImages.map((image) => (
                  <div key={image.id} className="overflow-hidden rounded-3xl border border-line bg-black/20">
                    <ImageWithFallback src={image.imageUrl} alt={image.filename} className="aspect-[4/3] w-full object-cover" />
                    <p className="truncate p-3 text-xs text-zinc-400">{image.filename}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card className="p-5">
            <p className="page-kicker">Submitted selection</p>
            <h2 className="font-serif text-3xl font-light">Review status</h2>
            {selection ? (
              <div className="mt-5 space-y-4">
                <div className="rounded-3xl border border-line bg-black/20 p-4">
                  <p className="text-sm text-muted">Selected layout</p>
                  <p className="font-medium">{selection.selectedLayoutName || "Not chosen"}</p>
                </div>
                <div className="rounded-3xl border border-line bg-black/20 p-4">
                  <p className="text-sm text-muted">Notes</p>
                  <p>{selection.notes || "No notes yet."}</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  {selection.selectedImages.map((image) => (
                    <ImageWithFallback key={image.id} src={image.imageUrl} alt="Selected client image" className="aspect-[4/3] w-full object-cover" />
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Select className="h-10 w-auto py-2" value={approvalStatus} onChange={(event) => setApprovalStatus(event.target.value)} disabled={busy}>
                    {["PENDING", "SUBMITTED", "APPROVED"].map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </Select>
                  <Button variant="outline" size="sm" onClick={updateSelectionStatus} disabled={busy}>
                    {activeAction === "selection-status" ? "Updating..." : "Update status"}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={reopenForEdits} disabled={busy}>
                    {activeAction === "reopen" ? "Reopening..." : "Reopen"}
                  </Button>
                  <a className="inline-flex h-9 items-center gap-2 rounded-full border border-line px-4 text-sm text-zinc-300" href={`/projects/${project.id}/review`}>
                    <Eye size={15} /> Review page
                  </a>
                </div>
              </div>
            ) : (
              <p className="mt-5 text-sm text-muted">No selection submitted yet.</p>
            )}
          </Card>
        </section>

        <Card className="p-5">
          <p className="page-kicker">Communication</p>
          <h2 className="font-serif text-3xl font-light">Request history</h2>
          {requestHistory.length === 0 && <p className="mt-4 text-sm text-muted">No requests yet.</p>}
          <div className="mt-5 space-y-3">
            {requestHistory.map((entry) => (
              <div key={entry.id} className="rounded-3xl border border-line bg-black/20 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted">
                  <span>{entry.authorEmail}</span>
                  <span>{new Date(entry.createdAt).toLocaleString()}</span>
                </div>
                <p className="mt-2">{entry.message}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={async () => {
                    clearFeedback();
                    setActiveAction(`resend:${entry.id}`);
                    try {
                      await readApiJson(
                        await fetch("/api/admin/request-resend", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ requestId: entry.id }),
                        }),
                        "Unable to resend the request email right now.",
                      );
                      setActionFeedback("Request email resent.");
                    } catch (error) {
                      setErrorMessage(
                        error instanceof Error
                          ? error.message
                          : "Unable to resend the request email right now.",
                      );
                    } finally {
                      setActiveAction(null);
                    }
                  }}
                  disabled={busy}
                >
                  {activeAction === `resend:${entry.id}` ? "Resending..." : "Resend request"}
                </Button>
              </div>
            ))}
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

  const projectId = context.params?.id as string;
  const project = await prisma.clientProject.findUnique({
    where: { id: projectId },
    include: { client: true },
  });
  if (!project) return { notFound: true };

  const layouts = await prisma.bookLayout.findMany({ orderBy: { createdAt: "desc" } });
  const assignedLayouts = await prisma.projectLayout.findMany({
    where: { projectId },
    select: { layoutId: true },
  });
  const images = await prisma.projectImage.findMany({
    where: { projectId },
    include: {
      comments: { include: { user: true }, orderBy: { createdAt: "desc" } },
      favorites: true,
    },
    orderBy: { uploadedAt: "desc" },
  });
  const selection = await prisma.clientSelection.findFirst({
    where: { projectId, clientId: project.clientId },
    include: { selectedImages: { include: { projectImage: true } }, selectedLayout: true },
  });
  const favorites = await prisma.photoFavorite.findMany({
    where: { galleryId: projectId, userId: project.clientId },
    include: { photo: true },
    orderBy: { createdAt: "desc" },
  });
  const requestHistory = await prisma.projectRequestMessage.findMany({
    where: { projectId },
    include: { author: true },
    orderBy: { createdAt: "desc" },
  });

  return {
    props: {
      project: {
        id: project.id,
        title: project.title,
        description: project.description,
        status: project.status,
        clientEmail: project.client.email,
        requestMessage: project.requestMessage,
      },
      layouts: await Promise.all(
        layouts.map(async (layout) => ({
          id: layout.id,
          name: layout.name,
          previewImageUrl: await getDisplayUrl(layout.previewImagePath, "/bg.jpg"),
          orientation: layout.orientation,
        })),
      ),
      assignedLayouts: assignedLayouts.map((item) => item.layoutId),
      images: await Promise.all(
        images.map(async (image) => ({
          id: image.id,
          imageUrl: await getDisplayUrl(image.imagePath, "/trumieyeslogo.png"),
          filename: image.filename,
          downloadable: image.downloadable,
          status: image.status,
          favoriteCount: image.favorites.length,
          comments: image.comments.map((comment) => ({
            id: comment.id,
            message: comment.message,
            createdAt: comment.createdAt.toISOString(),
            userEmail: comment.user.email,
          })),
        })),
      ),
      selection: selection
        ? {
            id: selection.id,
            selectedLayoutName: selection.selectedLayout?.name || null,
            notes: selection.notes,
            approvalStatus: selection.approvalStatus,
            selectedImages: await Promise.all(
              selection.selectedImages.map(async (item) => ({
                id: item.projectImageId,
                imageUrl: await getDisplayUrl(item.projectImage.imagePath, "/trumieyeslogo.png"),
              })),
            ),
          }
        : null,
      favoriteImages: await Promise.all(
        favorites.map(async (favorite) => ({
          id: favorite.photoId,
          imageUrl: await getDisplayUrl(favorite.photo.imagePath, "/trumieyeslogo.png"),
          filename: favorite.photo.filename,
        })),
      ),
      requestHistory: requestHistory.map((entry) => ({
        id: entry.id,
        message: entry.message,
        createdAt: entry.createdAt.toISOString(),
        authorEmail: entry.author.email,
      })),
    },
  };
};
