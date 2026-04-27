"use server";

import path from "path";
import { PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";
import { images } from "@/lib/db/schema";
import { FILE_SIZE_LIMITS, BLOCKED_TYPES } from "@/lib/upload";
import { getR2Client, isR2Configured } from "@/lib/r2";

const PRESIGNED_URL_TTL_SECONDS = 10 * 60;

type ActionError = {
  ok: false;
  error: string;
};

type ActionSuccess<T> = {
  ok: true;
  data: T;
};

export type ActionResult<T> = ActionSuccess<T> | ActionError;

export interface CreateDirectUploadInput {
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
  imageId: string;
  objectKey: string;
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

export async function createDirectUpload(
  input: CreateDirectUploadInput,
): Promise<ActionResult<CreateDirectUploadResponse>> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { ok: false, error: "Unauthorized" };
  }

  if (!isR2Configured()) {
    return { ok: false, error: "R2 storage is not configured" };
  }

  const fileName = input.fileName?.trim();
  const contentType = safeContentType(input.contentType);

  if (!fileName) {
    return { ok: false, error: "File name is required" };
  }

  if (!Number.isFinite(input.fileSize) || input.fileSize <= 0) {
    return { ok: false, error: "File size must be a positive number" };
  }

  if (input.fileSize > FILE_SIZE_LIMITS.FREE) {
    return { ok: false, error: "File exceeds allowed size" };
  }

  if (BLOCKED_TYPES.includes(contentType)) {
    return { ok: false, error: "This file type is blocked" };
  }

  const imageId = nanoid();
  const fileExtension = getFileExtension(fileName);
  const objectKey = `${session.user.id}/images/${imageId}${fileExtension}`;

  await db.insert(images).values({
    id: imageId,
    fileName,
    fileSize: input.fileSize,
    contentType,
    status: "pending",
    userId: session.user.id,
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
      ok: true,
      data: {
        imageId,
        objectKey,
        uploadUrl,
        publicUrl: buildPublicUrl(objectKey),
        expiresIn: PRESIGNED_URL_TTL_SECONDS,
      },
    };
  } catch (error) {
    await db
      .update(images)
      .set({ status: "failed" })
      .where(and(eq(images.id, imageId), eq(images.userId, session.user.id)));

    console.error("Failed to create direct upload URL:", error);
    return { ok: false, error: "Failed to create upload URL" };
  }
}

export async function finalizeDirectUpload(
  input: FinalizeDirectUploadInput,
): Promise<ActionResult<{ imageId: string; url: string }>> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { ok: false, error: "Unauthorized" };
  }

  const objectKey = input.objectKey?.trim();
  const imageId = input.imageId?.trim();

  if (!imageId || !objectKey) {
    return { ok: false, error: "imageId and objectKey are required" };
  }

  const [pendingImage] = await db
    .select({
      id: images.id,
      userId: images.userId,
      status: images.status,
    })
    .from(images)
    .where(and(eq(images.id, imageId), eq(images.userId, session.user.id)))
    .limit(1);

  if (!pendingImage) {
    return { ok: false, error: "Upload not found" };
  }

  if (pendingImage.status !== "pending") {
    return { ok: false, error: `Upload is already ${pendingImage.status}` };
  }

  try {
    await getR2Client().send(
      new HeadObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: objectKey,
      }),
    );
  } catch {
    return { ok: false, error: "Object not found in R2. Upload may have failed." };
  }

  const finalUrl = buildPublicUrl(objectKey);

  const [updatedImage] = await db
    .update(images)
    .set({
      status: "ready",
      url: finalUrl,
    })
    .where(and(eq(images.id, imageId), eq(images.userId, session.user.id), eq(images.status, "pending")))
    .returning({ id: images.id, url: images.url });

  if (!updatedImage?.url) {
    return { ok: false, error: "Upload could not be finalized" };
  }

  return {
    ok: true,
    data: {
      imageId: updatedImage.id,
      url: updatedImage.url,
    },
  };
}

export async function markDirectUploadFailed(imageId: string): Promise<ActionResult<null>> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { ok: false, error: "Unauthorized" };
  }

  const normalizedImageId = imageId.trim();
  if (!normalizedImageId) {
    return { ok: false, error: "imageId is required" };
  }

  await db
    .update(images)
    .set({ status: "failed" })
    .where(and(eq(images.id, normalizedImageId), eq(images.userId, session.user.id)));

  return { ok: true, data: null };
}
