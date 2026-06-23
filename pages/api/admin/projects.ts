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
    const projects = await prisma.clientProject.findMany({
      include: { client: true },
      orderBy: { createdAt: "desc" },
    });
    return res.status(200).json(projects);
  }

  if (req.method === "POST") {
    const title = typeof req.body.title === "string" ? req.body.title.trim() : "";
    const description =
      typeof req.body.description === "string" ? req.body.description.trim() : "";
    const clientId = typeof req.body.clientId === "string" ? req.body.clientId : "";

    if (!title || !clientId) {
      return res.status(400).json({ error: "Enter a project title and choose a client." });
    }

    const client = await prisma.user.findFirst({
      where: { id: clientId, role: "CLIENT" },
      select: { id: true },
    });
    if (!client) {
      return res.status(404).json({ error: "The selected client could not be found." });
    }

    const project = await prisma.clientProject.create({
      data: {
        title,
        description: description || null,
        clientId,
      },
    });
    return res.status(201).json(project);
  }

  return res.status(405).json({ error: "Method not allowed" });
}
