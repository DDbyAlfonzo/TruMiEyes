import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import { prisma } from "../../../lib/prisma";
import { hash } from "bcryptjs";
import { Prisma } from "@prisma/client";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session || session.user?.role !== "ADMIN") {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (req.method === "GET") {
    const clients = await prisma.user.findMany({
      where: { role: "CLIENT", active: true },
      select: { id: true, email: true, name: true },
    });
    return res.status(200).json(clients);
  }

  if (req.method === "POST") {
    const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
    const password = typeof req.body.password === "string" ? req.body.password : "";

    if (!email || !password) {
      return res.status(400).json({ error: "Enter an email and temporary password." });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "Temporary password must be at least 6 characters." });
    }

    try {
      const passwordHash = await hash(password, 10);
      const user = await prisma.user.create({
        data: {
          email,
          name: name || null,
          passwordHash,
          role: "CLIENT",
          active: true,
        },
      });
      return res.status(201).json({ id: user.id, email: user.email, name: user.name });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        return res.status(409).json({ error: "A client with this email already exists." });
      }

      console.error("[admin/clients] Failed to create client", error);
      return res.status(500).json({ error: "Unable to create client right now." });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
