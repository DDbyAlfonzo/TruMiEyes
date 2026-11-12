import { GetServerSideProps } from "next";
import Head from "next/head";
import { useCallback, useMemo, useState } from "react";
import { getServerSession } from "next-auth";
import { ArrowDown } from "lucide-react";
import { toast } from "sonner";
import { authOptions } from "../api/auth/[...nextauth]";
import { prisma } from "../../lib/prisma";
import { readApiJson } from "../../lib/clientApi";
import { getDisplayUrl, getDownloadUrl, getThumbnailUrl } from "../../lib/storage";
import { canClientAccessProject, isSelectionLocked } from "../../lib/workflowRules";
import type { LabelColor } from "../../lib/labels";
import { STUDIO_CONTACT_NAME } from "../../lib/studio";
import { GalleryHeader } from "../../components/gallery/GalleryHeader";
import { GalleryToolbar, MobileSelectionBar } from "../../components/gallery/GalleryToolbar";
import { PhotoTile } from "../../components/gallery/PhotoTile";
import { ProofingLightbox } from "../../components/gallery/ProofingLightbox";
import { ReviewSheet } from "../../components/gallery/ReviewSheet";
import type {
  GalleryComment,
  GalleryFilter,
  GalleryLayout,
  GalleryPhoto,
  PhotoState,
} from "../../components/gallery/types";

type Props = {
  project: {
    id: string;
    title: string;
    description: string | null;
    status: string;
    requestMessage: string | null;
    createdAt: string;
    shareUrl: string | null;
  };
  coverUrl: string | null;
  layouts: GalleryLayout[];
  photos: (GalleryPhoto & { comments: GalleryComment[]; label: LabelColor | null })[];
  favouriteIds: string[];
  selection: {
    selectedLayoutId: string | null;
    notes: string | null;
    approvalStatus: string;
  } | null;
};

type ProjectStatus = "DRAFT" | "SHARED" | "IN_REVIEW" | "APPROVED" | "COMPLETED";
type ApprovalStatus = "PENDING" | "SUBMITTED" | "APPROVED";

const jsonPost = (url: string, body: unknown, method = "POST") =>
  fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

export default function ClientGalleryPage({ project, coverUrl, layouts, photos, favouriteIds, selection }: Props) {
  const [approvalStatus, setApprovalStatus] = useState(selection?.approvalStatus || "PENDING");
  const [states, setStates] = useState<Record<string, PhotoState>>(() => {
    const favourites = new Set(favouriteIds);
    return Object.fromEntries(
      photos.map((photo) => [photo.id, { favourite: favourites.has(photo.id), label: photo.label, comments: photo.comments }]),
    );
  });
  const [filter, setFilter] = useState<GalleryFilter>("all");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [layoutId, setLayoutId] = useState(selection?.selectedLayoutId || (layouts.length === 1 ? layouts[0].id : ""));
  const [notes, setNotes] = useState(selection?.notes || "");
  const [submitting, setSubmitting] = useState(false);

  const locked = isSelectionLocked(approvalStatus as ApprovalStatus, project.status as ProjectStatus);
  const submitted = approvalStatus !== "PENDING";

  const visible = useMemo(
    () =>
      photos.filter((photo) => {
        const state = states[photo.id];
        if (filter === "favourites") return state.favourite;
        if (filter === "labelled") return Boolean(state.label);
        if (filter === "comments") return state.comments.length > 0;
        return true;
      }),
    [filter, photos, states],
  );

  const counts = useMemo(() => {
    const values = Object.values(states);
    return {
      all: photos.length,
      favourites: values.filter((s) => s.favourite).length,
      labelled: values.filter((s) => s.label).length,
      comments: values.filter((s) => s.comments.length > 0).length,
    };
  }, [photos.length, states]);

  const favourites = useMemo(() => photos.filter((photo) => states[photo.id]?.favourite), [photos, states]);
  const activeLayout = layouts.find((layout) => layout.id === layoutId) || (layouts.length === 1 ? layouts[0] : undefined);
  const target = activeLayout?.pageCount ?? null;

  const patch = (photoId: string, update: Partial<PhotoState>) =>
    setStates((prev) => ({ ...prev, [photoId]: { ...prev[photoId], ...update } }));

  const toggleFavourite = useCallback(
    async (photoId: string) => {
      if (locked) return;
      const was = states[photoId]?.favourite;
      patch(photoId, { favourite: !was });
      try {
        await readApiJson(await jsonPost("/api/favorites", { photoId }, was ? "DELETE" : "POST"), "Couldn't save that favourite.");
      } catch (error) {
        patch(photoId, { favourite: was });
        toast.error(error instanceof Error ? error.message : "Couldn't save that favourite.");
      }
    },
    [locked, states],
  );

  const setLabel = async (photoId: string, color: LabelColor | null) => {
    if (locked) return;
    const previous = states[photoId]?.label ?? null;
    patch(photoId, { label: color });
    try {
      await readApiJson(await jsonPost("/api/labels", { photoId, color }), "Couldn't save that label.");
    } catch (error) {
      patch(photoId, { label: previous });
      toast.error(error instanceof Error ? error.message : "Couldn't save that label.");
    }
  };

  const addComment = async (photoId: string, message: string) => {
    try {
      const saved = await readApiJson<GalleryComment & { createdAt: string }>(
        await jsonPost("/api/comments", { photoId, message }),
        "Couldn't save your note.",
      );
      setStates((prev) => ({
        ...prev,
        [photoId]: {
          ...prev[photoId],
          comments: [...prev[photoId].comments, { id: saved.id, message: saved.message, createdAt: String(saved.createdAt) }],
        },
      }));
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't save your note.");
      return false;
    }
  };

  const submitSelection = async () => {
    if (locked) return;
    setSubmitting(true);
    try {
      await readApiJson(
        await jsonPost("/api/selections", {
          projectId: project.id,
          selectedLayoutId: activeLayout?.id || null,
          notes,
          selectedImageIds: favourites.map((photo) => photo.id),
        }),
        "Couldn't send your selection.",
      );
      setApprovalStatus("SUBMITTED");
      toast.success(`Sent to ${STUDIO_CONTACT_NAME}. You'll hear back soon.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't send your selection.");
    } finally {
      setSubmitting(false);
    }
  };

  const openPhoto = (photoId: string) => setLightboxIndex(visible.findIndex((photo) => photo.id === photoId));

  return (
    <div className="gallery-theme min-h-screen">
      <Head>
        <title>{`${project.title} | TruMiEyes`}</title>
        <meta name="theme-color" content="#FAFAF8" />
      </Head>

      <GalleryHeader shareUrl={project.shareUrl} shareTitle={project.title} />

      <section className="relative h-[52vh] min-h-[340px] overflow-hidden bg-trumi-ink md:h-[68vh] md:max-h-[680px]">
        {coverUrl && (
          <img src={coverUrl} alt="" className="absolute inset-0 h-full w-full object-cover animate-tile-in" fetchPriority="high" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-trumi-ink/0 via-trumi-ink/10 to-trumi-ink/75" />
        <div className="absolute inset-x-0 bottom-0">
          <div className="mx-auto flex max-w-[1360px] flex-wrap items-end justify-between gap-6 px-4 pb-8 md:px-10 md:pb-14">
            <div className="max-w-3xl space-y-3 text-white">
              <p className="text-[11px] uppercase tracking-brand text-white/85">
                {photos.length} photos · {new Date(project.createdAt).toLocaleDateString(undefined, { month: "long", year: "numeric" })}
              </p>
              <h1 className="break-words font-display text-5xl font-extralight leading-[0.95] md:text-7xl lg:text-8xl">
                {project.title}
              </h1>
              {project.description && <p className="max-w-xl text-[15px] leading-7 text-white/85">{project.description}</p>}
            </div>
            <a
              href="#photos"
              className="inline-flex h-12 items-center gap-2.5 rounded-full bg-white px-6 text-sm font-semibold text-trumi-ink transition hover:bg-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-trumi-ink"
            >
              View photos <ArrowDown size={16} />
            </a>
          </div>
        </div>
      </section>

      <GalleryToolbar
        filter={filter}
        counts={counts}
        favouriteCount={counts.favourites}
        target={target}
        locked={locked}
        onFilterChange={setFilter}
        onReview={() => setReviewOpen(true)}
      />

      <main className="mx-auto max-w-[1360px] px-2 pb-32 pt-6 md:px-10 md:pb-20 md:pt-8">
        {project.status === "IN_REVIEW" && (
          <div className="mx-2 mb-6 rounded-xl bg-white p-4 text-sm leading-6 shadow-[0_0_0_1px_#E7E5E0] md:mx-0">
            <p className="font-semibold text-trumi-ink">{STUDIO_CONTACT_NAME === "the studio" ? "The studio" : STUDIO_CONTACT_NAME} asked for a few changes</p>
            <p className="text-ink-soft">{project.requestMessage || "Update your favourites and send them again."}</p>
          </div>
        )}
        {locked && (
          <div className="mx-2 mb-6 rounded-xl bg-white p-4 text-sm leading-6 shadow-[0_0_0_1px_#E7E5E0] md:mx-0">
            <p className="font-semibold text-trumi-ink">Your selection is with {STUDIO_CONTACT_NAME}</p>
            <p className="text-ink-soft">You can still browse, download and leave notes on photos.</p>
          </div>
        )}

        {photos.length === 0 ? (
          <EmptyMessage title="Your photos are on their way" body="This gallery will fill up as soon as your edits are ready." />
        ) : visible.length === 0 ? (
          <EmptyMessage title="Nothing here yet" body="Heart, label or comment on a photo and it will show up in this view." />
        ) : (
          <div className="columns-2 gap-2 md:columns-3 md:gap-3 xl:columns-4">
            {visible.map((photo, index) => (
              <PhotoTile
                key={photo.id}
                photo={photo}
                state={states[photo.id]}
                index={index}
                locked={locked}
                onOpen={() => openPhoto(photo.id)}
                onToggleFavourite={() => toggleFavourite(photo.id)}
              />
            ))}
          </div>
        )}
      </main>

      <footer className="border-t border-hairline py-10 text-center">
        <img src="/brand/wordmark.svg" alt="TruMiEyes" className="mx-auto h-3 w-auto opacity-80" />
      </footer>

      <MobileSelectionBar
        favouriteCount={counts.favourites}
        target={target}
        locked={locked}
        onReview={() => setReviewOpen(true)}
      />

      {lightboxIndex !== null && lightboxIndex >= 0 && visible.length > 0 && (
        <ProofingLightbox
          photos={visible}
          states={states}
          index={Math.min(lightboxIndex, visible.length - 1)}
          locked={locked}
          studioName={STUDIO_CONTACT_NAME}
          onIndexChange={setLightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onToggleFavourite={toggleFavourite}
          onSetLabel={setLabel}
          onAddComment={addComment}
        />
      )}

      {reviewOpen && (
        <ReviewSheet
          layouts={layouts}
          selectedLayoutId={activeLayout?.id || ""}
          favourites={favourites}
          notes={notes}
          locked={locked}
          submitting={submitting}
          submitted={submitted}
          target={target}
          studioName={STUDIO_CONTACT_NAME}
          onSelectLayout={setLayoutId}
          onNotesChange={setNotes}
          onSubmit={submitSelection}
          onClose={() => setReviewOpen(false)}
        />
      )}
    </div>
  );
}

function EmptyMessage({ title, body }: { title: string; body: string }) {
  return (
    <div className="mx-2 rounded-xl border border-dashed border-hairline px-6 py-20 text-center md:mx-0">
      <p className="font-display text-2xl font-light text-trumi-ink">{title}</p>
      <p className="mt-2 text-sm text-ink-soft">{body}</p>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions);
  if (!session || session.user?.role !== "CLIENT") {
    return { redirect: { destination: "/login", permanent: false } };
  }

  const userId = session.user.id;
  const projectId = context.params?.id as string;
  const project = await prisma.clientProject.findUnique({
    where: { id: projectId },
    include: {
      layouts: { include: { layout: true } },
      images: {
        where: { status: { in: ["CLIENT_REVIEW", "APPROVED"] } },
        include: {
          comments: { where: { userId }, orderBy: { createdAt: "asc" } },
          labels: { where: { userId } },
        },
        orderBy: { uploadedAt: "asc" },
      },
    },
  });
  if (
    !project ||
    !canClientAccessProject({ sessionUserId: userId, projectClientId: project.clientId, projectStatus: project.status })
  ) {
    return { notFound: true };
  }

  const [selection, favourites] = await Promise.all([
    prisma.clientSelection.findFirst({ where: { projectId, clientId: userId } }),
    prisma.photoFavorite.findMany({ where: { galleryId: projectId, userId }, select: { photoId: true } }),
  ]);

  const photos = await Promise.all(
    project.images.map(async (image) => {
      const imageUrl = await getDisplayUrl(image.imagePath, "/bg.jpg");
      return {
        id: image.id,
        imageUrl,
        thumbUrl: getThumbnailUrl(imageUrl),
        downloadUrl: getDownloadUrl(imageUrl, image.filename),
        filename: image.filename,
        downloadable: image.downloadable,
        label: (image.labels[0]?.color as LabelColor | undefined) ?? null,
        comments: image.comments.map((comment) => ({
          id: comment.id,
          message: comment.message,
          createdAt: comment.createdAt.toISOString(),
        })),
      };
    }),
  );

  const origin = process.env.NEXTAUTH_URL?.replace(/\/$/, "") || "";

  return {
    props: {
      project: {
        id: project.id,
        title: project.title,
        description: project.description,
        status: project.status,
        requestMessage: project.requestMessage,
        createdAt: project.createdAt.toISOString(),
        shareUrl: project.shareSlug && project.accessCodeHash ? `${origin}/g/${project.shareSlug}` : null,
      },
      coverUrl: photos[0]?.imageUrl ?? null,
      layouts: await Promise.all(
        project.layouts.map(async ({ layout }) => ({
          id: layout.id,
          name: layout.name,
          description: layout.description,
          pageCount: layout.pageCount,
          orientation: layout.orientation,
          previewImageUrl: await getDisplayUrl(layout.previewImagePath, "/bg.jpg"),
        })),
      ),
      photos,
      favouriteIds: favourites.map((favourite) => favourite.photoId),
      selection: selection
        ? { selectedLayoutId: selection.selectedLayoutId, notes: selection.notes, approvalStatus: selection.approvalStatus }
        : null,
    },
  };
};
