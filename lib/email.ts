import nodemailer from "nodemailer";

function createTransporter() {
  return nodemailer.createTransport(
    {
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    },
    {
      logger: true,
      debug: true,
    },
  );
}

const baseStyles = `
  font-family: 'Space Grotesk', Arial, sans-serif;
  background: #0B0D10;
  color: #F4F5F7;
  padding: 24px;
`;

const cardStyles = `
  background: #111318;
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 20px;
  padding: 24px;
`;

function requestChangesTemplate({
  projectTitle,
  message,
}: {
  projectTitle: string;
  message: string;
}) {
  return `
  <div style="${baseStyles}">
    <div style="${cardStyles}">
      <h2 style="margin-top:0;color:#E64249;">TruMiEyes · Changes Requested</h2>
      <p>Project: <strong>${projectTitle}</strong></p>
      <p style="color:#9AA0AA;">Message from your admin:</p>
      <div style="background:#0B0D10;padding:16px;border-radius:12px;">
        ${message}
      </div>
      <p style="margin-top:24px;color:#9AA0AA;">Please log in to update your selections.</p>
    </div>
  </div>
  `;
}

function passwordResetTemplate({
  resetLink,
}: {
  resetLink: string;
}) {
  return `
  <div style="${baseStyles}">
    <div style="${cardStyles}">
      <h2 style="margin-top:0;color:#E64249;">TruMiEyes · Reset Your Password</h2>
      <p>Click the button below to reset your password.</p>
      <p>
        <a href="${resetLink}" style="display:inline-block;background:#E64249;color:#fff;padding:12px 20px;border-radius:999px;text-decoration:none;">
          Reset password
        </a>
      </p>
      <p style="color:#9AA0AA;font-size:12px;">If you did not request this, you can safely ignore this email.</p>
    </div>
  </div>
  `;
}

export function isEmailConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

export async function sendRequestChangesEmail({
  to,
  projectTitle,
  message,
}: {
  to: string;
  projectTitle: string;
  message: string;
}) {
  if (!isEmailConfigured()) {
    return false;
  }

  await createTransporter().sendMail({
    from: process.env.SMTP_FROM || "TruMiEyes <no-reply@trumieyes.com>",
    to,
    subject: `Changes requested for ${projectTitle}`,
    text: `Changes requested for ${projectTitle}:\n\n${message}\n\nPlease log in to update your selections.`,
    html: requestChangesTemplate({ projectTitle, message }),
  });

  return true;
}

export async function sendPasswordResetEmail({
  to,
  resetLink,
}: {
  to: string;
  resetLink: string;
}) {
  if (!isEmailConfigured()) {
    return false;
  }

  try {
    console.log("[SMTP] Sending reset email to", to);
    const info = await createTransporter().sendMail({
      from: process.env.SMTP_FROM || "TruMiEyes <no-reply@trumieyes.com>",
      to,
      subject: "Reset your TruMiEyes password",
      text: `Reset your password: ${resetLink}`,
      html: passwordResetTemplate({ resetLink }),
    });
    console.log("[SMTP] Reset email sent", info.messageId);
    return true;
  } catch (error) {
    console.error("[SMTP] Reset email failed", error);
    throw error;
  }
}
