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
  const projectId = typeof req.body.projectId === "string" ? req.body.projectId : "";
  const status = typeof req.body.status === "string" ? req.body.status : "";
  const requestMessage =
    typeof req.body.requestMessage === "string" ? req.body.requestMessage.trim() : "";
  if (!projectId || !status) {
    return res.status(400).json({ error: "Choose a project and a valid status." });
  }
  const project = await prisma.clientProject.update({
    where: { id: projectId },
    data: {
      status,
      requestMessage: status === "IN_REVIEW" ? requestMessage || null : null,
    },
    include: { client: true },
  });

  let warning: string | null = null;
  if (status === "IN_REVIEW" && requestMessage) {
    await prisma.projectRequestMessage.create({
      data: {
        projectId,
        authorId: session.user?.id as string,
        message: requestMessage,
      },
    });
    if (!isEmailConfigured()) {
      warning = "Project updated, but email delivery is not configured yet.";
    } else {
      try {
        await sendRequestChangesEmail({
          to: project.client.email,
          projectTitle: project.title,
          message: requestMessage,
        });
      } catch (error) {
        console.error("[admin/project-status] Failed to send request email", error);
        warning = "Project updated, but the request email could not be sent.";
      }
    }
  }

  return res.status(200).json({ project, warning });
}
