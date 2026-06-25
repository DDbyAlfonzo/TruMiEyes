import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { hash } from "bcryptjs";
import { Prisma, Role } from "@prisma/client";
import { randomInt } from "crypto";
import { authOptions } from "../../auth/[...nextauth]";
import { prisma } from "../../../../lib/prisma";

function isRole(value: unknown): value is Role {
  return value === "ADMIN" || value === "CLIENT";
}

function generateTemporaryPassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*";
  return Array.from({ length: 18 }, () => chars[randomInt(chars.length)]).join("");
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session || session.user?.role !== "ADMIN") {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const id = typeof req.query.id === "string" ? req.query.id : "";
  if (!id) {
    return res.status(400).json({ error: "Missing user id." });
  }

  if (req.method === "PATCH") {
    const action = typeof req.body.action === "string" ? req.body.action : "update";

    if (action === "reset-password") {
      const requestedPassword = typeof req.body.password === "string" ? req.body.password : "";
      const temporaryPassword = requestedPassword || generateTemporaryPassword();
      if (temporaryPassword.length < 8) {
        return res.status(400).json({ error: "Temporary password must be at least 8 characters." });
      }

      await prisma.user.update({
        where: { id },
        data: { passwordHash: await hash(temporaryPassword, 10), active: true },
      });
      return res.status(200).json({ temporaryPassword });
    }

    const name = typeof req.body.name === "string" ? req.body.name.trim() : undefined;
    const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : undefined;
    const role = req.body.role === undefined ? undefined : isRole(req.body.role) ? req.body.role : null;
    const active = typeof req.body.active === "boolean" ? req.body.active : undefined;

    if (role === null) {
      return res.status(400).json({ error: "Choose a valid role." });
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: "Enter a valid email address." });
    }
    if (session.user?.id === id && active === false) {
      return res.status(400).json({ error: "You cannot deactivate your own account." });
    }

    try {
      const user = await prisma.user.update({
        where: { id },
        data: {
          ...(name !== undefined ? { name: name || null } : {}),
          ...(email ? { email } : {}),
          ...(role ? { role } : {}),
          ...(active !== undefined ? { active } : {}),
        },
        select: { id: true, name: true, email: true, role: true, active: true, createdAt: true },
      });

      return res.status(200).json({ ...user, createdAt: user.createdAt.toISOString() });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        return res.status(409).json({ error: "A user with this email already exists." });
      }

      console.error("[admin/users/:id] Failed to update user", error);
      return res.status(500).json({ error: "Unable to update user right now." });
    }
  }

  if (req.method === "DELETE") {
    if (session.user?.id === id) {
      return res.status(400).json({ error: "You cannot delete your own account." });
    }

    try {
      await prisma.user.delete({ where: { id } });
      return res.status(200).json({ deleted: true });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
        const user = await prisma.user.update({
          where: { id },
          data: { active: false },
          select: { id: true, name: true, email: true, role: true, active: true, createdAt: true },
        });
        return res.status(200).json({
          deleted: false,
          user: { ...user, createdAt: user.createdAt.toISOString() },
          message: "User has related records and was deactivated instead.",
        });
      }

      console.error("[admin/users/:id] Failed to delete user", error);
      return res.status(500).json({ error: "Unable to delete user right now." });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
