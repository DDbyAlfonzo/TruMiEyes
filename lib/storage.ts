import { v2 as cloudinary } from "cloudinary";

const hasCloudinaryConfig = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET,
);

let configured = false;

function configureCloudinary() {
  if (!hasCloudinaryConfig) {
    return false;
  }

  if (!configured) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true,
    });
    configured = true;
  }

  return true;
}

export function isStorageConfigured() {
  return configureCloudinary();
}

export async function uploadImage(filePath: string, filename: string) {
  if (!configureCloudinary()) {
    throw new Error("Cloudinary is not configured for production uploads.");
  }

  const result = await cloudinary.uploader.upload(filePath, {
    folder: "trumieyes/project-images",
    resource_type: "image",
    use_filename: true,
    unique_filename: true,
    overwrite: false,
    context: { filename },
  });

  return {
    secureUrl: result.secure_url,
    publicId: result.public_id,
  };
}

function isCloudinaryUrl(path: string) {
  return /^https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\//.test(path);
}

function applyCloudinaryTransform(path: string, transform: string) {
  if (!isCloudinaryUrl(path) || path.includes(`/${transform}/`)) {
    return path;
  }

  return path.replace("/image/upload/", `/image/upload/${transform}/`);
}

export async function getSignedUrl(path: string) {
  if (path.startsWith("/") || path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  throw new Error("Stored image path is not a Cloudinary URL.");
}

export async function getDisplayUrl(path: string, fallbackPath = "/bg.jpg") {
  try {
    const url = await getSignedUrl(path);
    return applyCloudinaryTransform(url, "f_auto,q_auto");
  } catch (error) {
    console.error("[storage] Failed to resolve asset URL", path, error);
    return fallbackPath;
  }
}

export function getDownloadUrl(path: string, filename?: string) {
  const attachmentName = filename ? `:attachment:${encodeURIComponent(filename)}` : "";
  return applyCloudinaryTransform(path, `fl_attachment${attachmentName}`);
}
