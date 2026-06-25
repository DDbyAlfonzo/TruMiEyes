import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { compare, hash } from "bcryptjs";
import { Prisma } from "@prisma/client";
import { authOptions } from "../auth/[...nextauth]";
import { prisma } from "../../../lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session || session.user?.role !== "ADMIN" || !session.user.id) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (req.method !== "PATCH") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const name = typeof req.body.name === "string" ? req.body.name.trim() : undefined;
  const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : undefined;
  const currentPassword = typeof req.body.currentPassword === "string" ? req.body.currentPassword : "";
  const newPassword = typeof req.body.newPassword === "string" ? req.body.newPassword : "";

  if (!name && !email && !newPassword) {
    return res.status(400).json({ error: "Update at least one account field." });
  }

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: "Enter a valid email address." });
  }

  if (newPassword && newPassword.length < 8) {
    return res.status(400).json({ error: "New password must be at least 8 characters." });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, passwordHash: true },
  });
  if (!user) {
    return res.status(404).json({ error: "Account not found." });
  }

  if (newPassword) {
    if (!currentPassword) {
      return res.status(400).json({ error: "Enter your current password to set a new password." });
    }
    const valid = await compare(currentPassword, user.passwordHash);
    if (!valid) {
      return res.status(400).json({ error: "Current password is incorrect." });
    }
  }

  try {
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(name !== undefined ? { name: name || null } : {}),
        ...(email ? { email } : {}),
        ...(newPassword ? { passwordHash: await hash(newPassword, 10) } : {}),
      },
      select: { id: true, name: true, email: true, role: true, active: true },
    });

    return res.status(200).json(updated);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return res.status(409).json({ error: "An account with this email already exists." });
    }

    console.error("[admin/account] Failed to update account", error);
    return res.status(500).json({ error: "Unable to update account right now." });
  }
}
