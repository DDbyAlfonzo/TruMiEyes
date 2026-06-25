import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "./auth/[...nextauth]";
import formidable from "formidable";
import path from "path";
import fs from "fs";
import os from "os";
import { getBucket } from "../../lib/storage";

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
      const ext = path.extname(original);
      const objectName = `uploads/${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
      const bucket = getBucket();

      if (!bucket) {
        return res.status(500).json({
          error: "Uploads are unavailable until Google Cloud Storage is configured.",
        });
      }

      await bucket.upload(file.filepath, {
        destination: objectName,
        resumable: false,
        contentType: file.mimetype || "application/octet-stream",
      });
      return res.status(200).json({ path: objectName, filename: original });
    } catch (error) {
      console.error("[upload] Upload failed", error);
      return res.status(500).json({
        error: "Upload failed. Check your storage configuration and try again.",
      });
    }
  });
}
