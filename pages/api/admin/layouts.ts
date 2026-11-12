import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import { prisma } from "../../../lib/prisma";
import { MAX_PAGES, countSlots, parseSlots } from "../../../lib/booklets";

const ORIENTATIONS = ["PORTRAIT", "LANDSCAPE", "SQUARE"] as const;
type Orientation = (typeof ORIENTATIONS)[number];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session || session.user?.role !== "ADMIN") {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (req.method === "GET") {
    const layouts = await prisma.bookLayout.findMany({
      orderBy: { createdAt: "desc" },
      include: { pages: { orderBy: { index: "asc" } } },
    });
    return res.status(200).json(layouts);
  }

  if (req.method === "POST") {
    const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
    const description = typeof req.body.description === "string" ? req.body.description.trim() : "";
    const orientation = typeof req.body.orientation === "string" ? (req.body.orientation as Orientation) : null;

    if (!name) return res.status(400).json({ error: "Give the booklet a name." });
    if (!orientation || !ORIENTATIONS.includes(orientation)) {
      return res.status(400).json({ error: "Choose a page shape." });
    }

    // Booklet built from sketches: pages with photo slots.
    if (Array.isArray(req.body.pages)) {
      const pages = (req.body.pages as unknown[]).slice(0, MAX_PAGES).map((page) => {
        const value = (page ?? {}) as { sketchPath?: unknown; slots?: unknown };
        return {
          sketchPath: typeof value.sketchPath === "string" ? value.sketchPath : "",
          slots: parseSlots(value.slots),
        };
      });
      if (!pages.length) return res.status(400).json({ error: "Add at least one sketch page." });
      if (pages.some((page) => !/^https:\/\//.test(page.sketchPath) && !page.sketchPath.startsWith("/"))) {
        return res.status(400).json({ error: "A sketch is still uploading. Try again in a moment." });
      }
      if (pages.some((page) => page.slots.length === 0)) {
        return res.status(400).json({ error: "Every page needs at least one photo slot." });
      }

      const layout = await prisma.bookLayout.create({
        data: {
          name,
          description: description || null,
          orientation,
          previewImagePath: pages[0].sketchPath,
          pageCount: countSlots(pages),
          createdByAdminId: session.user.id,
          pages: {
            create: pages.map((page, index) => ({ index, sketchPath: page.sketchPath, slots: page.slots })),
          },
        },
      });
      return res.status(201).json(layout);
    }

    // Legacy: a single preview image with a page count.
    const previewImagePath = typeof req.body.previewImagePath === "string" ? req.body.previewImagePath : "";
    const pageCount = Number(req.body.pageCount);
    if (!previewImagePath) return res.status(400).json({ error: "Upload a preview image." });
    if (!Number.isInteger(pageCount) || pageCount < 1) {
      return res.status(400).json({ error: "Page count must be a whole number greater than 0." });
    }
    const layout = await prisma.bookLayout.create({
      data: {
        name,
        description: description || null,
        previewImagePath,
        pageCount,
        orientation,
        createdByAdminId: session.user.id,
      },
    });
    return res.status(201).json(layout);
  }

  if (req.method === "DELETE") {
    const layoutId = typeof req.body?.layoutId === "string" ? req.body.layoutId : "";
    if (!layoutId) return res.status(400).json({ error: "Choose a booklet." });
    const inUse = await prisma.clientSelection.count({ where: { selectedLayoutId: layoutId } });
    if (inUse > 0) {
      return res.status(409).json({ error: "A client has already chosen this booklet, so it can't be removed." });
    }
    await prisma.$transaction([
      prisma.projectLayout.deleteMany({ where: { layoutId } }),
      prisma.bookLayout.delete({ where: { id: layoutId } }),
    ]);
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
