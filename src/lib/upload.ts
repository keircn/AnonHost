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

export function formatFileSize(bytes: number): string {
  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${Math.round(size * 100) / 100} ${units[unitIndex]}`;
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
