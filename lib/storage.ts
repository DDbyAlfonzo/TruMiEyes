import { Storage, type Bucket } from "@google-cloud/storage";

const hasGcsConfig = Boolean(
  process.env.GCS_PROJECT_ID &&
    process.env.GCS_BUCKET_NAME &&
    process.env.GCS_CLIENT_EMAIL &&
    process.env.GCS_PRIVATE_KEY,
);

let storage: Storage | null = null;

type CacheEntry = { url: string; expiresAt: number };

const signedUrlCache = new Map<string, CacheEntry>();

function createStorageClient() {
  if (!hasGcsConfig) {
    return null;
  }

  if (!storage) {
    storage = new Storage({
      projectId: process.env.GCS_PROJECT_ID,
      credentials: {
        client_email: process.env.GCS_CLIENT_EMAIL,
        private_key: process.env.GCS_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      },
    });
  }

  return storage;
}

export function getBucket(): Bucket | null {
  const storageClient = createStorageClient();
  const bucketName = process.env.GCS_BUCKET_NAME;

  if (!storageClient || !bucketName) {
    return null;
  }

  return storageClient.bucket(bucketName);
}

export async function getSignedUrl(path: string, expiresInMinutes = 30) {
  if (path.startsWith("/")) {
    return path;
  }

  const now = Date.now();
  const cached = signedUrlCache.get(path);
  if (cached && cached.expiresAt > now) {
    return cached.url;
  }

  const bucket = getBucket();
  if (!bucket) {
    throw new Error("Google Cloud Storage is not configured for this asset path.");
  }

  const [url] = await bucket.file(path).getSignedUrl({
    action: "read",
    expires: now + expiresInMinutes * 60 * 1000,
  });
  signedUrlCache.set(path, { url, expiresAt: now + (expiresInMinutes - 2) * 60 * 1000 });
  return url;
}

export async function getDisplayUrl(path: string, fallbackPath = "/bg.jpg") {
  try {
    return await getSignedUrl(path);
  } catch (error) {
    console.error("[storage] Failed to resolve asset URL", path, error);
    return fallbackPath;
  }
}
