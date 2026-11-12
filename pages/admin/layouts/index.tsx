import { GetServerSideProps } from "next";
import Link from "next/link";
import { useState } from "react";
import { getServerSession } from "next-auth";
import { PenLine, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { authOptions } from "../../api/auth/[...nextauth]";
import { prisma } from "../../../lib/prisma";
import { readApiJson } from "../../../lib/clientApi";
import { getDisplayUrl, getThumbnailUrl } from "../../../lib/storage";
import { parseSlots, type Orientation, type Slot } from "../../../lib/booklets";
import { AppShell } from "../../../components/AppShell";
import { Button } from "../../../components/ui/button";
import { EmptyState } from "../../../components/EmptyState";
import { BookletPage } from "../../../components/booklet/BookletPage";

type Booklet = {
  id: string;
  name: string;
  description: string | null;
  orientation: Orientation;
  capacity: number;
  previewImageUrl: string;
  pages: { sketchUrl: string; slots: Slot[] }[];
};

export default function LayoutsPage({ layouts }: { layouts: Booklet[] }) {
  const [items, setItems] = useState(layouts);
  const [busy, setBusy] = useState<string | null>(null);

  const remove = async (layout: Booklet) => {
    if (busy) return;
    setBusy(layout.id);
    try {
      await readApiJson(
        await fetch("/api/admin/layouts", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ layoutId: layout.id }),
        }),
        "Couldn't remove that booklet.",
      );
      setItems((prev) => prev.filter((item) => item.id !== layout.id));
      toast.success(`${layout.name} removed.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't remove that booklet.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <AppShell
      role="admin"
      title="Booklets"
      eyebrow="Admin"
      actions={
        <Link
          href="/admin/layouts/new"
          className="inline-flex h-11 items-center gap-2 rounded-full bg-brand-red px-5 text-sm font-medium text-white hover:bg-trumi-red-deep"
        >
          <PenLine size={16} /> <span className="hidden sm:inline">New from sketch</span>
        </Link>
      }
    >
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="page-kicker">Album design</p>
          <h2 className="editorial-title mt-3">Your booklets.</h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-muted">
            Sketch a page, upload it, and it becomes a booklet clients can choose — with their favourite photos placed right into your layout.
          </p>
        </div>
      </div>

      {items.length === 0 ? (
        <EmptyState
          title="No booklets yet"
          description="Upload a sketch of your album pages to create your first booklet."
          actionLabel="New from sketch"
          href="/admin/layouts/new"
        />
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((layout) => (
            <li key={layout.id} className="overflow-hidden rounded-3xl border border-line bg-surface">
              <div className="flex h-56 items-center justify-center gap-2 bg-[#ECEAE5] p-5">
                {layout.pages.length ? (
                  layout.pages.slice(0, 3).map((page, i) => (
                    <div key={i} className="h-full" style={{ aspectRatio: layout.orientation === "LANDSCAPE" ? "3/2" : layout.orientation === "SQUARE" ? "1" : "3/4" }}>
                      <BookletPage orientation={layout.orientation} slots={page.slots} sketchUrl={page.sketchUrl} showSketch />
                    </div>
                  ))
                ) : (
                  <img src={layout.previewImageUrl} alt="" className="h-full w-full object-cover" />
                )}
              </div>
              <div className="flex items-start justify-between gap-3 p-4">
                <div className="min-w-0">
                  <h3 className="truncate font-semibold">{layout.name}</h3>
                  <p className="mt-1 text-sm text-muted">
                    {layout.capacity} photos{layout.pages.length ? ` · ${layout.pages.length} pages` : ""} · {layout.orientation.toLowerCase()}
                  </p>
                  {layout.description && <p className="mt-1 truncate text-xs text-zinc-500">{layout.description}</p>}
                </div>
                <Button variant="ghost" size="icon" aria-label={`Remove ${layout.name}`} onClick={() => remove(layout)} disabled={busy === layout.id}>
                  <Trash2 size={16} />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions);
  if (!session || session.user?.role !== "ADMIN") {
    return { redirect: { destination: "/login", permanent: false } };
  }

  const layouts = await prisma.bookLayout.findMany({
    orderBy: { createdAt: "desc" },
    include: { pages: { orderBy: { index: "asc" } } },
  });

  return {
    props: {
      layouts: await Promise.all(
        layouts.map(async (layout) => ({
          id: layout.id,
          name: layout.name,
          description: layout.description,
          orientation: layout.orientation,
          capacity: layout.pageCount,
          previewImageUrl: await getDisplayUrl(layout.previewImagePath, "/bg.jpg"),
          pages: await Promise.all(
            layout.pages.map(async (page) => ({
              sketchUrl: getThumbnailUrl(await getDisplayUrl(page.sketchPath, "/bg.jpg"), 600),
              slots: parseSlots(page.slots),
            })),
          ),
        })),
      ),
    },
  };
};
