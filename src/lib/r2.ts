import {
  S3Client,
  PutObjectCommand,
  HeadBucketCommand,
} from "@aws-sdk/client-s3";

export const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export interface UploadToR2Options {
  file: Buffer;
  key: string;
  contentType: string;
  userId: string;
}

export async function uploadToR2({
  file,
  key,
  contentType,
  userId,
}: UploadToR2Options): Promise<string> {
  try {
    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key,
      Body: file,
      ContentType: contentType,
      Metadata: {
        userId: userId,
        uploadedAt: new Date().toISOString(),
      },
    });

    await r2Client.send(command);

    return `${process.env.R2_PUBLIC_URL}/${key}`;
  } catch (error) {
    console.error("R2 upload error:", error);
    throw new Error("Failed to upload to R2");
  }
}

export async function checkR2Connection(): Promise<boolean> {
  try {
    const command = new HeadBucketCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
    });

    await r2Client.send(command);
    return true;
  } catch (error) {
    console.error("R2 connection error:", error);
    return false;
  }
}

export function generateR2Key(
  userId: string,
  fileId: string,
  fileExt: string,
  type?: string,
): string {
  if (type) {
    return `${userId}/${type}s/${fileId}${fileExt}`;
  }
  return `${userId}/${fileId}${fileExt}`;
}
