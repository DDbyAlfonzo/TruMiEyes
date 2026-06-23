import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import { prisma } from "../../../lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session || session.user?.role !== "ADMIN") {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { projectId, layoutIds } = req.body;
  if (!projectId || !Array.isArray(layoutIds)) {
    return res.status(400).json({ error: "Choose a project and valid layouts." });
  }

  const project = await prisma.clientProject.findUnique({
    where: { id: projectId },
    select: { id: true },
  });
  if (!project) {
    return res.status(404).json({ error: "Project not found." });
  }

  const uniqueLayoutIds = Array.from(
    new Set(layoutIds.filter((layoutId: unknown): layoutId is string => typeof layoutId === "string")),
  );
  const matchingLayouts = await prisma.bookLayout.findMany({
    where: { id: { in: uniqueLayoutIds } },
    select: { id: true },
  });
  if (matchingLayouts.length !== uniqueLayoutIds.length) {
    return res.status(400).json({ error: "One or more selected layouts could not be found." });
  }

  await prisma.projectLayout.deleteMany({ where: { projectId } });
  await prisma.projectLayout.createMany({
    data: uniqueLayoutIds.map((layoutId) => ({ projectId, layoutId })),
  });

  return res.status(200).json({ success: true });
}
