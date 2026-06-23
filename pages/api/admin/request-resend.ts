import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import { prisma } from "../../../lib/prisma";
import { isEmailConfigured, sendRequestChangesEmail } from "../../../lib/email";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session || session.user?.role !== "ADMIN") {
    return res.status(401).json({ error: "Unauthorized" });
  }
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { requestId } = req.body;
  if (!requestId) {
    return res.status(400).json({ error: "Missing requestId" });
  }

  const request = await prisma.projectRequestMessage.findUnique({
    where: { id: requestId },
    include: { project: { include: { client: true } } },
  });

  if (!request) {
    return res.status(404).json({ error: "Request not found" });
  }

  if (!isEmailConfigured()) {
    return res.status(503).json({ error: "Email delivery is not configured yet." });
  }

  try {
    await sendRequestChangesEmail({
      to: request.project.client.email,
      projectTitle: request.project.title,
      message: request.message,
    });
  } catch (error) {
    console.error("[admin/request-resend] Failed to resend email", error);
    return res.status(502).json({ error: "Unable to resend the request email right now." });
  }

  return res.status(200).json({ success: true });
}
