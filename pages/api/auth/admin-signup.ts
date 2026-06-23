import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../../lib/prisma";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
  const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const password = typeof req.body.password === "string" ? req.body.password : "";
  const invite = typeof req.body.invite === "string" ? req.body.invite.trim() : "";

  if (!email || !password || !invite) {
    return res.status(400).json({ error: "Enter your email, password, and admin invite code." });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters long." });
  }

  if (!process.env.ADMIN_INVITE_TOKEN) {
    return res.status(503).json({ error: "Admin signup is not configured yet." });
  }

  if (invite !== process.env.ADMIN_INVITE_TOKEN) {
    return res.status(403).json({ error: "Invalid invite code" });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        name: name || null,
        email,
        passwordHash,
        role: "ADMIN",
      },
    });

    return res.status(201).json({ id: user.id, email: user.email });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return res.status(409).json({ error: "An account with this email already exists." });
    }

    console.error("[auth/admin-signup] Failed to create admin", error);
    return res.status(500).json({ error: "Unable to create the admin account right now." });
  }
}
