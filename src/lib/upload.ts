import { S3Client } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { nanoid } from "nanoid";

interface UploadResult {
  url: string;
  filename: string;
  size: number;
  width: number;
  height: number;
}

export const STORAGE_LIMITS = {
  PREMIUM: 1024 * 1024 * 1024,
  FREE: 500 * 1024 * 1024,
};

export const FILE_SIZE_LIMITS = {
  PREMIUM: 100 * 1024 * 1024,
  FREE: 50 * 1024 * 1024,
};

interface StorageStats {
  used: string;
  total: string;
  percentage: string;
  remaining: string;
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
): StorageStats {
  const limit = isPremium ? STORAGE_LIMITS.PREMIUM : STORAGE_LIMITS.FREE;
  const percentage = Math.round((used / limit) * 100);

  return {
    used: formatFileSize(used),
    total: formatFileSize(limit),
    percentage: `${Math.min(percentage, 100)}%`,
    remaining: formatFileSize(Math.max(0, limit - used)),
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

export async function uploadImage(
  file: File,
  userId: string,
): Promise<UploadResult> {
  try {
    const filename = `${userId}/${nanoid()}-${file.name}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const upload = new Upload({
      client: s3Client,
      params: {
        Bucket: process.env.R2_BUCKET_NAME!,
        Key: filename,
        Body: buffer,
        ContentType: file.type,
        ACL: "public-read",
      },
    });

    await upload.done();

    const url = `${process.env.R2_PUBLIC_URL}/${filename}`;

    return {
      url,
      filename: file.name,
      size: file.size,
      width: 0,
      height: 0,
    };
  } catch (error) {
    console.error("Error uploading image:", error);
    throw new Error("Failed to upload image");
  }
}
