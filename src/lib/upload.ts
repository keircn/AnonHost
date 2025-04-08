import { S3Client } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { nanoid } from "nanoid";

export const STORAGE_LIMITS = {
  PREMIUM: 1024 * 1024 * 1024,
  FREE: 500 * 1024 * 1024,
};

export const FILE_SIZE_LIMITS = {
  PREMIUM: 500 * 1024 * 1024,
  FREE: 100 * 1024 * 1024,
};

interface StorageStats {
  used: string;
  total: string;
  percentage: string;
  remaining: string;
}

interface UploadResult {
  url: string;
  filename: string;
  size: number;
  width: number | null;
  height: number | null;
  duration?: number | null;
  type: "image" | "video" | "text" | "document";
}

function formatFileSize(bytes: number): string {
  const KB = 1024;
  const MB = KB * 1024;
  const GB = MB * 1024;

  if (bytes < KB) {
    return `${Math.round(bytes)} B`;
  } else if (bytes < MB) {
    return `${Math.round((bytes / KB) * 10) / 10} KB`;
  } else if (bytes < GB) {
    return `${Math.round((bytes / MB) * 10) / 10} MB`;
  } else {
    return `${Math.round((bytes / GB) * 10) / 10} GB`;
  }
}

export function getStorageStats(
  used: number,
  isPremium: boolean,
  isAdmin: boolean = false,
): StorageStats {
  const limit = isAdmin
    ? Number.MAX_SAFE_INTEGER
    : isPremium
      ? STORAGE_LIMITS.PREMIUM
      : STORAGE_LIMITS.FREE;

  const percentage = isAdmin ? 0 : Math.round((used / limit) * 100);

  return {
    used: formatFileSize(used),
    total: isAdmin ? "Unlimited" : formatFileSize(limit),
    percentage: isAdmin ? "0%" : `${Math.min(percentage, 100)}%`,
    remaining: isAdmin
      ? "Unlimited"
      : formatFileSize(Math.max(0, limit - used)),
  };
}

const s3Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export async function uploadFile(
  file: File,
  userId: string,
  type: "avatar" | "banner" | undefined = undefined,
): Promise<UploadResult> {
  try {
    const filename = type === "avatar"
      ? `avatars/${userId}/${nanoid()}-avatar${getFileExtension(file.name)}`
      : type === "banner"
        ? `banners/${userId}/${nanoid()}-banner${getFileExtension(file.name)}`
        : `${userId}/${nanoid()}-${file.name}`;

    const buffer = Buffer.from(await file.arrayBuffer());

    let fileType: UploadResult["type"];
    if (file.type.startsWith("image/")) {
      fileType = "image";
    } else if (file.type.startsWith("video/")) {
      fileType = "video";
    } else if (
      file.type.startsWith("text/") ||
      file.type.includes("json") ||
      file.type.includes("xml")
    ) {
      fileType = "text";
    } else {
      fileType = "document";
    }

    const upload = new Upload({
      client: s3Client,
      params: {
        Bucket: process.env.R2_BUCKET_NAME!,
        Key: filename,
        Body: buffer,
        ContentType: file.type,
        ACL: "public-read",
        ...(type && {
          CacheControl: "public, max-age=31536000",
        }),
      },
    });

    await upload.done();

    const url = `${process.env.R2_PUBLIC_URL}/${filename}`;

    return {
      url,
      filename: file.name,
      size: file.size,
      width: fileType === "image" ? 0 : null,
      height: fileType === "image" ? 0 : null,
      ...(fileType === "video" ? { duration: 0 } : {}),
      type: fileType,
    };
  } catch (error) {
    console.error("Error uploading file:", error);
    throw new Error("Failed to upload file");
  }
}
function getFileExtension(name: string): string {
  const lastDotIndex = name.lastIndexOf(".");
  if (lastDotIndex === -1 || lastDotIndex === name.length - 1) {
    return "";
  }
  return name.substring(lastDotIndex);
}
