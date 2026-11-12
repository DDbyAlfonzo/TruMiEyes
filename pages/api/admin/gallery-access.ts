import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { hash } from "bcryptjs";
import { authOptions } from "../auth/[...nextauth]";
import { prisma } from "../../../lib/prisma";
import { generateAccessCode, generateShareSlug } from "../../../lib/galleryAccess";

/**
 * POST   { projectId } → creates (or rotates) the gallery link + code. The plain code is returned once.
 * DELETE { projectId } → turns off code access for the gallery link.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session || session.user?.role !== "ADMIN") {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const projectId = typeof req.body?.projectId === "string" ? req.body.projectId : "";
  if (!projectId) {
    return res.status(400).json({ error: "Choose a gallery first." });
  }

  const project = await prisma.clientProject.findUnique({
    where: { id: projectId },
    select: { id: true, shareSlug: true },
  });
  if (!project) {
    return res.status(404).json({ error: "Gallery not found." });
  }

  if (req.method === "POST") {
    const code = generateAccessCode();
    let shareSlug = project.shareSlug;

    for (let attempt = 0; !shareSlug && attempt < 5; attempt += 1) {
      const candidate = generateShareSlug();
      const taken = await prisma.clientProject.findUnique({ where: { shareSlug: candidate }, select: { id: true } });
      if (!taken) shareSlug = candidate;
    }
    if (!shareSlug) {
      return res.status(500).json({ error: "Couldn't create a gallery link. Please try again." });
    }

    await prisma.clientProject.update({
      where: { id: project.id },
      data: {
        shareSlug,
        accessCodeHash: await hash(code, 10),
        accessFailedAttempts: 0,
        accessLockedUntil: null,
      },
    });

    const origin = process.env.NEXTAUTH_URL?.replace(/\/$/, "") || "";
    return res.status(200).json({ slug: shareSlug, code, url: `${origin}/g/${shareSlug}` });
  }

  if (req.method === "DELETE") {
    await prisma.clientProject.update({
      where: { id: project.id },
      data: { accessCodeHash: null, accessFailedAttempts: 0, accessLockedUntil: null },
    });
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
