import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../../lib/prisma";
import { isEmailConfigured, sendPasswordResetEmail } from "../../../lib/email";
import crypto from "crypto";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
  if (!email) {
    return res.status(400).json({ error: "Enter your email address to request a reset link." });
  }

  if (!process.env.NEXTAUTH_URL || !isEmailConfigured()) {
    return res.status(503).json({
      error: "Password reset is unavailable until email delivery is configured.",
    });
  }

  console.log("[SMTP] request-reset invoked for", email);

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(200).json({ success: true });
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  await prisma.passwordResetToken.deleteMany({
    where: { userId: user.id },
  });
  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      token,
      expiresAt,
    },
  });

  const resetLink = `${process.env.NEXTAUTH_URL}/reset?token=${token}&email=${encodeURIComponent(email)}`;
  try {
    await sendPasswordResetEmail({ to: email, resetLink });
  } catch (error) {
    console.error("[SMTP] request-reset error", error);
  }

  return res.status(200).json({ success: true });
}
