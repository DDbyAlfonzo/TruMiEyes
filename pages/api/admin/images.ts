import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import { prisma } from "../../../lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session || session.user?.role !== "ADMIN") {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (req.method === "POST") {
    const projectId = typeof req.body.projectId === "string" ? req.body.projectId : "";
    const imagePath = typeof req.body.imagePath === "string" ? req.body.imagePath : "";
    const filename = typeof req.body.filename === "string" ? req.body.filename.trim() : "";
    const status = typeof req.body.status === "string" ? req.body.status : "CLIENT_REVIEW";
    const downloadable =
      typeof req.body.downloadable === "boolean" ? req.body.downloadable : false;
    if (!projectId || !imagePath || !filename) {
      return res.status(400).json({ error: "Choose a project and upload an image first." });
    }

    const project = await prisma.clientProject.findUnique({
      where: { id: projectId },
      select: { id: true },
    });
    if (!project) {
      return res.status(404).json({ error: "Project not found." });
    }

    const image = await prisma.projectImage.create({
      data: {
        projectId,
        imagePath,
        filename,
        status,
        downloadable,
      },
    });
    return res.status(201).json(image);
  }

  return res.status(405).json({ error: "Method not allowed" });
}
