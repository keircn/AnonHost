import { S3Client, PutObjectCommand, HeadBucketCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

const REQUIRED_R2_ENV_VARS = [
  "R2_ACCOUNT_ID",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_BUCKET_NAME",
  "R2_PUBLIC_URL",
] as const;

let cachedConnectionStatus: boolean | null = null;
let lastConnectionCheckAt = 0;
const CONNECTION_CHECK_TTL_MS = 30_000;

export function isR2Configured(): boolean {
  return REQUIRED_R2_ENV_VARS.every((name) => Boolean(process.env[name]));
}

function getR2Client() {
  if (!isR2Configured()) {
    throw new Error("R2 is not fully configured");
  }

  return new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
    maxAttempts: 2,
    useDualstackEndpoint: false,
  });
}

interface UploadToR2Options {
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
    const r2Client = getR2Client();
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
  const now = Date.now();
  if (cachedConnectionStatus !== null && now - lastConnectionCheckAt < CONNECTION_CHECK_TTL_MS) {
    return cachedConnectionStatus;
  }

  try {
    const r2Client = getR2Client();
    const command = new HeadBucketCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
    });

    await r2Client.send(command);
    cachedConnectionStatus = true;
    lastConnectionCheckAt = now;
    return true;
  } catch (error) {
    console.error("R2 connection error:", error);
    cachedConnectionStatus = false;
    lastConnectionCheckAt = now;
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

export async function deleteFromR2Key(key: string): Promise<void> {
  const r2Client = getR2Client();

  await r2Client.send(
    new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key,
    }),
  );
}
