import { GetServerSideProps } from "next";
import { useMemo, useState } from "react";
import { getServerSession } from "next-auth";
import { Download, Heart } from "lucide-react";
import { authOptions } from "../api/auth/[...nextauth]";
import { prisma } from "../../lib/prisma";
import { readApiJson } from "../../lib/clientApi";
import { getDisplayUrl, getDownloadUrl } from "../../lib/storage";
import Lightbox from "../../components/Lightbox";
import { canClientAccessProject, isSelectionLocked } from "../../lib/workflowRules";
import { AppShell } from "../../components/AppShell";
import { StatusBadge } from "../../components/StatusBadge";
import { SelectionBar } from "../../components/SelectionBar";
import { EmptyState } from "../../components/EmptyState";
import { PhotoCard } from "../../components/PhotoCard";
import { CommentPanel } from "../../components/CommentPanel";
import { Textarea } from "../../components/ui/textarea";
import { Button } from "../../components/ui/button";
import { ImageWithFallback } from "../../components/ImageWithFallback";
import { BrandMark } from "../../components/BrandMark";

type Layout = {
  id: string;
  name: string;
  previewImageUrl: string;
  description: string | null;
};

type ProjectImage = {
  id: string;
  imageUrl: string;
  downloadUrl: string;
  filename: string;
  downloadable: boolean;
  status: string;
  uploadedAt: string;
  comments: PhotoComment[];
};

type PhotoComment = {
  id: string;
  message: string;
  createdAt: string;
};

type Props = {
  project: {
    id: string;
    title: string;
    description: string | null;
    status: string;
    requestMessage: string | null;
    createdAt: string;
  };
  layouts: Layout[];
  images: ProjectImage[];
  existingSelection: {
    selectedLayoutId: string | null;
    notes: string | null;
    selectedImages: string[];
    approvalStatus: string;
  } | null;
  favoriteIds: string[];
  requestHistory: { id: string; message: string; createdAt: string }[];
};

export default function ProjectDetailPage({
  project,
  layouts,
  images,
  existingSelection,
  favoriteIds,
  requestHistory,
}: Props) {
  const [selectedLayout, setSelectedLayout] = useState(existingSelection?.selectedLayoutId || "");
  const [favoriteImages, setFavoriteImages] = useState(
    new Set(favoriteIds.length ? favoriteIds : existingSelection?.selectedImages || []),
  );
  const [notes, setNotes] = useState(existingSelection?.notes || "");
  const [commentsByImage, setCommentsByImage] = useState(
    Object.fromEntries(images.map((image) => [image.id, image.comments])),
  );
  const [draftComments, setDraftComments] = useState<Record<string, string>>({});
  const [viewFavoritesOnly, setViewFavoritesOnly] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const locked = isSelectionLocked(
    existingSelection?.approvalStatus as "PENDING" | "SUBMITTED" | "APPROVED" | undefined,
    project.status as "DRAFT" | "SHARED" | "IN_REVIEW" | "APPROVED" | "COMPLETED",
  );
  const visibleImages = useMemo(
    () => images.filter((image) => !viewFavoritesOnly || favoriteImages.has(image.id)),
    [favoriteImages, images, viewFavoritesOnly],
  );
  const selectedCount = favoriteImages.size;

  const toggleFavorite = async (photoId: string) => {
    if (locked) return;
    const wasFavorite = favoriteImages.has(photoId);
    setFavoriteImages((prev) => {
      const next = new Set(prev);
      if (wasFavorite) next.delete(photoId);
      else next.add(photoId);
      return next;
    });
    setError("");
    setActiveAction(`favorite:${photoId}`);

    try {
      await readApiJson(
        await fetch("/api/favorites", {
          method: wasFavorite ? "DELETE" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ photoId }),
        }),
        "Unable to update favourites right now.",
      );
    } catch (err) {
      setFavoriteImages((prev) => {
        const next = new Set(prev);
        if (wasFavorite) next.add(photoId);
        else next.delete(photoId);
        return next;
      });
      setError(err instanceof Error ? err.message : "Unable to update favourites right now.");
    } finally {
      setActiveAction(null);
    }
  };

  const submitComment = async (photoId: string) => {
    const draft = draftComments[photoId]?.trim();
    if (!draft) return;
    setError("");
    setMessage("");
    setActiveAction(`comment:${photoId}`);
    try {
      const saved = await readApiJson<PhotoComment>(
        await fetch("/api/comments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ photoId, message: draft }),
        }),
        "Unable to save the comment right now.",
      );
      setCommentsByImage((prev) => ({
        ...prev,
        [photoId]: [...(prev[photoId] || []), saved],
      }));
      setDraftComments((prev) => ({ ...prev, [photoId]: "" }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save the comment right now.");
    } finally {
      setActiveAction(null);
    }
  };

  const submitSelection = async () => {
    if (locked) return;
    setError("");
    setMessage("");
    setActiveAction("submit");
    try {
      await readApiJson(
        await fetch("/api/selections", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectId: project.id,
            selectedLayoutId: selectedLayout || null,
            notes,
            selectedImageIds: Array.from(favoriteImages),
          }),
        }),
        "Unable to submit your selection right now.",
      );
      setMessage("Selection submitted for review.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to submit your selection right now.");
    } finally {
      setActiveAction(null);
    }
  };

  return (
    <AppShell role="client" title={project.title} eyebrow="Gallery">
      <div className="space-y-10">
        <header className="relative overflow-hidden rounded-3xl border border-line bg-surface">
          <div className="absolute inset-0">
            <ImageWithFallback
              src={images[0]?.imageUrl || "/bg.jpg"}
              alt=""
              className="h-full w-full object-cover opacity-30"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-background via-background/85 to-background/25" />
          </div>
          <div className="relative px-5 py-12 md:px-10 md:py-16">
            <div className="max-w-3xl">
              <BrandMark className="mb-8" />
              <p className="page-kicker">Client gallery</p>
              <h1 className="editorial-title mt-3">{project.title}</h1>
              {project.description && <p className="mt-4 max-w-2xl leading-7 text-muted">{project.description}</p>}
              <div className="mt-6 flex flex-wrap gap-2">
                <StatusBadge status={project.status} />
                <span className="rounded-full border border-line px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-zinc-400">
                  {images.length} photos
                </span>
                <span className="rounded-full border border-line px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-zinc-400">
                  {new Date(project.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </header>

        {project.status === "IN_REVIEW" && (
          <div className="border-l-2 border-brand-red bg-surface p-4 text-sm text-zinc-300">
            <p className="font-semibold text-white">Changes requested</p>
            <p className="mt-1">{project.requestMessage || "Please update your selection and resubmit."}</p>
          </div>
        )}
        {locked && (
          <div className="border-l-2 border-emerald-400 bg-emerald-500/10 p-4 text-sm text-emerald-100">
            Your submitted selection is locked. Ask the admin to reopen this gallery if changes are needed.
          </div>
        )}
        {error && <p className="text-sm text-red-400">{error}</p>}
        {message && <p className="text-sm text-emerald-300">{message}</p>}

        {layouts.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <h2 className="font-serif text-3xl font-light">Layout choice</h2>
              <span className="text-sm text-zinc-500">{selectedLayout ? "Selected" : "Optional"}</span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {layouts.map((layout) => (
                <button
                  key={layout.id}
                  onClick={() => setSelectedLayout(layout.id)}
                  disabled={locked}
                  aria-label={`Select layout ${layout.name}`}
                className={`bg-surface p-3 text-left transition ${
                  selectedLayout === layout.id
                      ? "border border-brand-red"
                      : "border border-line hover:border-brand-red/60"
                  }`}
                >
                  <ImageWithFallback
                    src={layout.previewImageUrl}
                    alt={layout.name}
                    className="aspect-[4/3] w-full object-cover"
                  />
                  <p className="mt-3 font-semibold">{layout.name}</p>
                  <p className="mt-1 text-sm text-white/55">{layout.description}</p>
                </button>
              ))}
            </div>
          </section>
        )}

        <section className="space-y-5">
          <SelectionBar
            selectedCount={selectedCount}
            viewFavoritesOnly={viewFavoritesOnly}
            submitting={activeAction === "submit"}
            locked={locked}
            onToggleFilter={() => setViewFavoritesOnly((value) => !value)}
            onSubmit={submitSelection}
          />

          {images.length === 0 && (
            <EmptyState
              title="No photos available yet"
              description="Your gallery will appear here once images are ready for review."
            />
          )}
          {images.length > 0 && visibleImages.length === 0 && (
            <EmptyState
              title="No favourites selected yet"
              description="Return to all photos and mark your preferred images."
            />
          )}

          <div className="columns-1 gap-5 sm:columns-2 lg:columns-3 2xl:columns-4 [&>*]:mb-5">
            {visibleImages.map((image) => {
              const sourceIndex = images.findIndex((item) => item.id === image.id);
              const isFavorite = favoriteImages.has(image.id);
              const comments = commentsByImage[image.id] || [];
              return (
                <div key={image.id} className="break-inside-avoid">
                  <PhotoCard
                    imageUrl={image.imageUrl}
                    downloadUrl={image.downloadUrl}
                    filename={image.filename}
                    selected={isFavorite}
                    downloadable={image.downloadable}
                    commentCount={comments.length}
                    onOpen={() => setLightboxIndex(sourceIndex)}
                    onToggleFavorite={() => toggleFavorite(image.id)}
                  />
                  <div className="border-x border-b border-line bg-surface px-3 pb-3">
                    <CommentPanel
                      comments={comments}
                      value={draftComments[image.id] || ""}
                      onChange={(value) =>
                        setDraftComments((prev) => ({ ...prev, [image.id]: value }))
                      }
                      onSubmit={() => submitComment(image.id)}
                      saving={activeAction === `comment:${image.id}`}
                      compact
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="space-y-3 thin-divider pt-6">
          <h2 className="font-serif text-3xl font-light">Selection notes</h2>
          <Textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Add any preferences, retouching notes, or delivery requests..."
            disabled={locked}
          />
        </section>

        <section className="space-y-3 thin-divider pt-6">
          <h2 className="font-serif text-3xl font-light">Request history</h2>
          {requestHistory.length === 0 && <p className="text-white/55">No change requests yet.</p>}
          {requestHistory.map((entry) => (
            <div key={entry.id} className="rounded-3xl border border-line bg-surface p-4">
              <p className="text-xs text-zinc-500">{new Date(entry.createdAt).toLocaleString()}</p>
              <p className="mt-2 text-white/70">{entry.message}</p>
            </div>
          ))}
        </section>
      </div>

      {lightboxIndex !== null && (
        <Lightbox
          items={images}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          renderActions={(image) => (
            <div className="hidden items-center gap-2 sm:flex">
              {image.downloadable && (
                <a
                  className="inline-flex h-10 items-center gap-2 rounded-full border border-white/15 px-4 text-sm"
                  href={image.downloadUrl}
                  download={image.filename}
                >
                  <Download size={15} />
                  Download
                </a>
              )}
              <Button
                variant={favoriteImages.has(image.id) ? "primary" : "outline"}
                onClick={() => toggleFavorite(image.id)}
                disabled={locked}
              >
                <Heart size={15} className={favoriteImages.has(image.id) ? "fill-black" : ""} />
                {favoriteImages.has(image.id) ? "Favourite" : "Select"}
              </Button>
            </div>
          )}
        />
      )}
    </AppShell>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions);
  if (!session || session.user?.role !== "CLIENT") {
    return { redirect: { destination: "/login", permanent: false } };
  }

  const projectId = context.params?.id as string;
  const project = await prisma.clientProject.findUnique({
    where: { id: projectId },
    include: {
      layouts: { include: { layout: true } },
      images: {
        where: { status: { in: ["CLIENT_REVIEW", "APPROVED"] } },
        include: {
          comments: {
            where: { userId: session.user.id as string },
            orderBy: { createdAt: "asc" },
          },
        },
        orderBy: { uploadedAt: "desc" },
      },
    },
  });
  if (
    !project ||
    !canClientAccessProject({
      sessionUserId: session.user.id,
      projectClientId: project.clientId,
      projectStatus: project.status,
    })
  ) {
    return { notFound: true };
  }

  const selection = await prisma.clientSelection.findFirst({
    where: { projectId, clientId: session.user.id as string },
    include: { selectedImages: true },
  });
  const favorites = await prisma.photoFavorite.findMany({
    where: { galleryId: projectId, userId: session.user.id as string },
    select: { photoId: true },
  });
  const requestHistory = await prisma.projectRequestMessage.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
  });

  return {
    props: {
      project: {
        id: project.id,
        title: project.title,
        description: project.description,
        status: project.status,
        requestMessage: project.requestMessage,
        createdAt: project.createdAt.toISOString(),
      },
      layouts: await Promise.all(
        project.layouts.map(async (item) => ({
          id: item.layout.id,
          name: item.layout.name,
          previewImageUrl: await getDisplayUrl(item.layout.previewImagePath, "/bg.jpg"),
          description: item.layout.description,
        })),
      ),
      images: await Promise.all(
        project.images.map(async (image) => {
          const imageUrl = await getDisplayUrl(image.imagePath, "/trumieyeslogo.png");
          return {
            id: image.id,
            imageUrl,
            downloadUrl: getDownloadUrl(imageUrl, image.filename),
            filename: image.filename,
            downloadable: image.downloadable,
            status: image.status,
            uploadedAt: image.uploadedAt.toISOString(),
            comments: image.comments.map((comment) => ({
              id: comment.id,
              message: comment.message,
              createdAt: comment.createdAt.toISOString(),
            })),
          };
        }),
      ),
      existingSelection: selection
        ? {
            selectedLayoutId: selection.selectedLayoutId,
            notes: selection.notes,
            selectedImages: selection.selectedImages.map((item) => item.projectImageId),
            approvalStatus: selection.approvalStatus,
          }
        : null,
      favoriteIds: favorites.map((favorite) => favorite.photoId),
      requestHistory: requestHistory.map((entry) => ({
        id: entry.id,
        message: entry.message,
        createdAt: entry.createdAt.toISOString(),
      })),
    },
  };
};
