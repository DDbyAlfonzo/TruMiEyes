import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { hash } from "bcryptjs";
import { Prisma, Role } from "@prisma/client";
import { randomInt } from "crypto";
import { authOptions } from "../auth/[...nextauth]";
import { prisma } from "../../../lib/prisma";

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

  if (req.method === "GET") {
    const users = await prisma.user.findMany({
      orderBy: [{ role: "asc" }, { createdAt: "desc" }],
      select: { id: true, name: true, email: true, role: true, active: true, createdAt: true },
    });
    return res.status(200).json(users.map((user) => ({ ...user, createdAt: user.createdAt.toISOString() })));
  }

  if (req.method === "POST") {
    const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
    const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const role = isRole(req.body.role) ? req.body.role : null;
    const requestedPassword = typeof req.body.password === "string" ? req.body.password : "";
    const temporaryPassword = requestedPassword || generateTemporaryPassword();

    if (!email || !role) {
      return res.status(400).json({ error: "Enter an email and choose a role." });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: "Enter a valid email address." });
    }
    if (temporaryPassword.length < 8) {
      return res.status(400).json({ error: "Temporary password must be at least 8 characters." });
    }

    try {
      const passwordHash = await hash(temporaryPassword, 10);
      const user = await prisma.user.create({
        data: {
          email,
          name: name || null,
          role,
          active: true,
          passwordHash,
        },
        select: { id: true, name: true, email: true, role: true, active: true, createdAt: true },
      });

      return res.status(201).json({
        ...user,
        createdAt: user.createdAt.toISOString(),
        temporaryPassword,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        return res.status(409).json({ error: "A user with this email already exists." });
      }

      console.error("[admin/users] Failed to create user", error);
      return res.status(500).json({ error: "Unable to create user right now." });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
