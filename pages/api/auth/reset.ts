import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../../lib/prisma";
import bcrypt from "bcryptjs";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const token = typeof req.body.token === "string" ? req.body.token.trim() : "";
  const password = typeof req.body.password === "string" ? req.body.password : "";
  if (!email || !token || !password) {
    return res.status(400).json({ error: "Open the reset link from your email and try again." });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters long." });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(400).json({ error: "This reset link is invalid or has expired." });
  }

  const reset = await prisma.passwordResetToken.findUnique({ where: { token } });
  if (!reset || reset.userId !== user.id || reset.expiresAt < new Date()) {
    return res.status(400).json({ error: "This reset link is invalid or has expired." });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
  await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });

  return res.status(200).json({ success: true });
}
