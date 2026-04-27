import path from "path";
import { HeadObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "@/lib/db";
import { images, media, type MediaType } from "@/lib/db/schema";
import { BLOCKED_TYPES, FILE_SIZE_LIMITS } from "@/lib/upload";
import { getR2Client, isR2Configured } from "@/lib/r2";

const PRESIGNED_URL_TTL_SECONDS = 10 * 60;

export interface CreateDirectUploadInput {
  userId: string;
  fileName: string;
  fileSize: number;
  contentType: string;
}

export interface CreateDirectUploadResponse {
  imageId: string;
  objectKey: string;
  uploadUrl: string;
  publicUrl: string;
  expiresIn: number;
}

export interface FinalizeDirectUploadInput {
  userId: string;
  imageId: string;
  objectKey: string;
  public?: boolean;
  disableEmbed?: boolean;
  domain?: string | null;
}

export interface FinalizeDirectUploadResponse {
  imageId: string;
  mediaId: string;
  url: string;
}

function safeContentType(contentType: string): string {
  const value = contentType.trim().toLowerCase();
  if (!value) {
    return "application/octet-stream";
  }
  return value;
}

function getFileExtension(fileName: string): string {
  const rawExt = path.extname(fileName).trim().toLowerCase();
  if (!rawExt) {
    return "";
  }
  return rawExt.replace(/[^a-z0-9.]/g, "");
}

function buildPublicUrl(objectKey: string): string {
  const baseUrl = process.env.R2_PUBLIC_URL?.replace(/\/$/, "");
  if (!baseUrl) {
    throw new Error("R2_PUBLIC_URL is not configured");
  }
  return `${baseUrl}/${objectKey}`;
}

function inferMediaType(contentType: string, fileName: string): MediaType {
  const normalizedContentType = contentType.toLowerCase();
  const extension = path.extname(fileName).toLowerCase();
  const archiveExtensions = new Set([".zip", ".rar", ".7z", ".tar", ".gz", ".bz2", ".xz"]);

  if (archiveExtensions.has(extension)) {
    return "ARCHIVE";
  }
  if (normalizedContentType.startsWith("image/")) {
    return "IMAGE";
  }
  if (normalizedContentType.startsWith("video/")) {
    return "VIDEO";
  }
  if (normalizedContentType.startsWith("audio/")) {
    return "AUDIO";
  }
  if (
    normalizedContentType.startsWith("text/") ||
    normalizedContentType.includes("json") ||
    normalizedContentType.includes("xml")
  ) {
    return "TEXT";
  }
  return "DOCUMENT";
}

export async function createDirectUploadForUser(
  input: CreateDirectUploadInput,
): Promise<CreateDirectUploadResponse> {
  if (!isR2Configured()) {
    throw new Error("R2 storage is not configured");
  }

  const fileName = input.fileName?.trim();
  const contentType = safeContentType(input.contentType);

  if (!fileName) {
    throw new Error("File name is required");
  }

  if (!Number.isFinite(input.fileSize) || input.fileSize <= 0) {
    throw new Error("File size must be a positive number");
  }

  if (input.fileSize > FILE_SIZE_LIMITS.FREE) {
    throw new Error("File exceeds allowed size");
  }

  if (BLOCKED_TYPES.includes(contentType)) {
    throw new Error("This file type is blocked");
  }

  const imageId = nanoid();
  const fileExtension = getFileExtension(fileName);
  const objectKey = `${input.userId}/images/${imageId}${fileExtension}`;

  await db.insert(images).values({
    id: imageId,
    fileName,
    fileSize: input.fileSize,
    contentType,
    status: "pending",
    userId: input.userId,
    url: null,
  });

  try {
    const putObjectCommand = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: objectKey,
      ContentType: contentType,
    });

    const signingClient = getR2Client() as unknown as Parameters<typeof getSignedUrl>[0];
    const signingCommand = putObjectCommand as unknown as Parameters<typeof getSignedUrl>[1];
    const uploadUrl = await getSignedUrl(signingClient, signingCommand, {
      expiresIn: PRESIGNED_URL_TTL_SECONDS,
    });

    return {
      imageId,
      objectKey,
      uploadUrl,
      publicUrl: buildPublicUrl(objectKey),
      expiresIn: PRESIGNED_URL_TTL_SECONDS,
    };
  } catch (error) {
    await db
      .update(images)
      .set({ status: "failed" })
      .where(and(eq(images.id, imageId), eq(images.userId, input.userId)));

    console.error("Failed to create direct upload URL:", error);
    throw new Error("Failed to create upload URL");
  }
}

export async function finalizeDirectUploadForUser(
  input: FinalizeDirectUploadInput,
): Promise<FinalizeDirectUploadResponse> {
  const objectKey = input.objectKey?.trim();
  const imageId = input.imageId?.trim();

  if (!imageId || !objectKey) {
    throw new Error("imageId and objectKey are required");
  }

  const [pendingImage] = await db
    .select({
      id: images.id,
      status: images.status,
      fileName: images.fileName,
      fileSize: images.fileSize,
      contentType: images.contentType,
    })
    .from(images)
    .where(and(eq(images.id, imageId), eq(images.userId, input.userId)))
    .limit(1);

  if (!pendingImage) {
    throw new Error("Upload not found");
  }

  if (pendingImage.status !== "pending") {
    throw new Error(`Upload is already ${pendingImage.status}`);
  }

  try {
    await getR2Client().send(
      new HeadObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: objectKey,
      }),
    );
  } catch {
    throw new Error("Object not found in R2. Upload may have failed.");
  }

  const finalUrl = buildPublicUrl(objectKey);
  const mediaId = nanoid(6);
  const normalizedDomain = input.domain?.trim();

  await db.insert(media).values({
    id: mediaId,
    url: finalUrl,
    filename: pendingImage.fileName,
    size: pendingImage.fileSize,
    width: null,
    height: null,
    duration: null,
    type: inferMediaType(pendingImage.contentType, pendingImage.fileName),
    userId: input.userId,
    public: Boolean(input.public),
    disableEmbed: Boolean(input.disableEmbed),
    domain: normalizedDomain && normalizedDomain !== "anonhost.cc" ? normalizedDomain : null,
    archiveType: null,
    fileCount: null,
    archiveMeta: null,
  });

  const [updatedImage] = await db
    .update(images)
    .set({
      status: "ready",
      url: finalUrl,
    })
    .where(and(eq(images.id, imageId), eq(images.userId, input.userId), eq(images.status, "pending")))
    .returning({ id: images.id, url: images.url });

  if (!updatedImage?.url) {
    throw new Error("Upload could not be finalized");
  }

  return {
    imageId: updatedImage.id,
    mediaId,
    url: updatedImage.url,
  };
}

export async function markDirectUploadFailedForUser(userId: string, imageId: string): Promise<void> {
  const normalizedImageId = imageId.trim();
  if (!normalizedImageId) {
    throw new Error("imageId is required");
  }

  await db
    .update(images)
    .set({ status: "failed" })
    .where(and(eq(images.id, normalizedImageId), eq(images.userId, userId)));
}
