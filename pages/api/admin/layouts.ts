import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import { prisma } from "../../../lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session || session.user?.role !== "ADMIN") {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (req.method === "GET") {
    const layouts = await prisma.bookLayout.findMany({ orderBy: { createdAt: "desc" } });
    return res.status(200).json(layouts);
  }

  if (req.method === "POST") {
    const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
    const description =
      typeof req.body.description === "string" ? req.body.description.trim() : "";
    const previewImagePath =
      typeof req.body.previewImagePath === "string" ? req.body.previewImagePath : "";
    const pageCount = Number(req.body.pageCount);
    const orientation = typeof req.body.orientation === "string" ? req.body.orientation : "";

    if (!name || !previewImagePath || !orientation) {
      return res.status(400).json({ error: "Complete the layout details and upload a preview image." });
    }
    if (!Number.isInteger(pageCount) || pageCount < 1) {
      return res.status(400).json({ error: "Page count must be a whole number greater than 0." });
    }
    if (!["PORTRAIT", "LANDSCAPE", "SQUARE"].includes(orientation)) {
      return res.status(400).json({ error: "Choose a valid layout orientation." });
    }
    const layout = await prisma.bookLayout.create({
      data: {
        name,
        description: description || null,
        previewImagePath,
        pageCount,
        orientation,
        createdByAdminId: session.user?.id as string,
      },
    });
    return res.status(201).json(layout);
  }

  return res.status(405).json({ error: "Method not allowed" });
}
