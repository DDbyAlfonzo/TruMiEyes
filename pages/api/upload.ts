import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "./auth/[...nextauth]";
import formidable from "formidable";
import path from "path";
import fs from "fs";
import os from "os";
import { uploadImage } from "../../lib/storage";

export const config = {
  api: {
    bodyParser: false,
  },
};

const uploadDir = path.join(os.tmpdir(), "trumieyes-uploads");

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session || session.user?.role !== "ADMIN") {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const form = formidable({
    uploadDir,
    keepExtensions: true,
    multiples: false,
  });

  form.parse(req, async (err: Error | null, _fields: unknown, files: any) => {
    if (err) {
      return res.status(500).json({ error: "Upload failed" });
    }
    try {
      const file = Array.isArray(files.file) ? files.file[0] : files.file;
      if (!file) {
        return res.status(400).json({ error: "Choose a file before uploading." });
      }
      const original = file.originalFilename || "upload";
      const upload = await uploadImage(file.filepath, original);
      return res.status(200).json({ path: upload.secureUrl, filename: original });
    } catch (error) {
      console.error("[upload] Upload failed", error);
      if (error instanceof Error && error.message.includes("Cloudinary is not configured")) {
        return res.status(500).json({
          error:
            "Uploads are unavailable until Cloudinary is configured. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.",
        });
      }
      return res.status(500).json({
        error: "Upload failed. Check your Cloudinary configuration and try again.",
      });
    }
  });
}
