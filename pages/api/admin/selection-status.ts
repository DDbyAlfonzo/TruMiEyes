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

  const selectionId = typeof req.body.selectionId === "string" ? req.body.selectionId : "";
  const approvalStatus =
    typeof req.body.approvalStatus === "string" ? req.body.approvalStatus : "";
  const projectStatus = typeof req.body.projectStatus === "string" ? req.body.projectStatus : "";
  const requestMessage =
    typeof req.body.requestMessage === "string" ? req.body.requestMessage.trim() : "";
  if (!selectionId || !approvalStatus) {
    return res.status(400).json({ error: "Choose a selection and a valid approval status." });
  }

  const existingSelection = await prisma.clientSelection.findUnique({
    where: { id: selectionId },
    select: { id: true, projectId: true },
  });
  if (!existingSelection) {
    return res.status(404).json({ error: "Selection not found." });
  }

  const selection = await prisma.clientSelection.update({
    where: { id: existingSelection.id },
    data: { approvalStatus },
  });

  let warning: string | null = null;
  if (projectStatus) {
    const project = await prisma.clientProject.update({
      where: { id: selection.projectId },
      data: {
        status: projectStatus,
        requestMessage: projectStatus === "IN_REVIEW" ? requestMessage || null : null,
      },
      include: { client: true },
    });
    if (projectStatus === "IN_REVIEW" && requestMessage) {
      await prisma.projectRequestMessage.create({
        data: {
          projectId: project.id,
          authorId: session.user?.id as string,
          message: requestMessage,
        },
      });
      if (!isEmailConfigured()) {
        warning = "Selection updated, but email delivery is not configured yet.";
      } else {
        try {
          await sendRequestChangesEmail({
            to: project.client.email,
            projectTitle: project.title,
            message: requestMessage,
          });
        } catch (error) {
          console.error("[admin/selection-status] Failed to send request email", error);
          warning = "Selection updated, but the request email could not be sent.";
        }
      }
    }
  }

  return res.status(200).json({ selection, warning });
}
