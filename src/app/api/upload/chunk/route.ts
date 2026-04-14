import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { promises as fs } from "fs";
import path from "path";
import { createHash } from "crypto";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import { verifyApiKey } from "@/lib/auth";
import { finalizeUpload } from "@/lib/server/upload-finalizer";

const CHUNK_TEMP_DIR = path.join(process.cwd(), "uploads", ".chunks");
const CHUNK_UPLOAD_TTL_MS = 24 * 60 * 60 * 1000;
const CHUNK_CLEANUP_INTERVAL_MS = 10 * 60 * 1000;
let lastChunkCleanupAt = 0;

async function getAuthContext(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const apiKey = request.headers.get("authorization")?.split("Bearer ")[1];

  if (!session && !apiKey) {
    return null;
  }

  if (apiKey) {
    const user = await verifyApiKey(apiKey);
    if (!user) {
      return null;
    }

    await prisma.apiKey.update({
      where: { key: apiKey },
      data: { lastUsed: new Date() },
    });

    return {
      userId: user.id.toString(),
      isPremium: Boolean(user.premium),
    };
  }

  return {
    userId: session!.user.id.toString(),
    isPremium: Boolean(session!.user.premium),
  };
}

async function getUploadedChunkIndexes(uploadDir: string): Promise<number[]> {
  try {
    const entries = await fs.readdir(uploadDir);
    return entries
      .map((entry) => {
        const match = entry.match(/^(\d+)\.part$/);
        return match ? Number.parseInt(match[1], 10) : -1;
      })
      .filter((index) => index >= 0)
      .sort((a, b) => a - b);
  } catch {
    return [];
  }
}

function computeSha256Hex(input: Buffer): string {
  return createHash("sha256").update(input).digest("hex");
}

async function cleanupStaleChunkUploads() {
  const now = Date.now();
  if (now - lastChunkCleanupAt < CHUNK_CLEANUP_INTERVAL_MS) {
    return;
  }

  lastChunkCleanupAt = now;

  try {
    const userDirs = await fs.readdir(CHUNK_TEMP_DIR, { withFileTypes: true });

    await Promise.all(
      userDirs
        .filter((entry) => entry.isDirectory())
        .map(async (userDir) => {
          const userPath = path.join(CHUNK_TEMP_DIR, userDir.name);
          const uploadDirs = await fs.readdir(userPath, { withFileTypes: true });

          await Promise.all(
            uploadDirs
              .filter((entry) => entry.isDirectory())
              .map(async (uploadDir) => {
                const uploadPath = path.join(userPath, uploadDir.name);
                const stat = await fs.stat(uploadPath);

                if (now - stat.mtimeMs > CHUNK_UPLOAD_TTL_MS) {
                  await fs.rm(uploadPath, { recursive: true, force: true });
                }
              }),
          );
        }),
    );
  } catch {
    return;
  }
}

export async function GET(request: NextRequest) {
  await cleanupStaleChunkUploads();

  const auth = await getAuthContext(request);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const uploadId = request.nextUrl.searchParams.get("uploadId");
  if (!uploadId) {
    return NextResponse.json({ error: "Missing uploadId" }, { status: 400 });
  }

  const uploadDir = path.join(CHUNK_TEMP_DIR, auth.userId, uploadId);
  const uploadedChunks = await getUploadedChunkIndexes(uploadDir);

  return NextResponse.json({
    uploadId,
    uploadedChunks,
  });
}

export async function POST(request: NextRequest) {
  await cleanupStaleChunkUploads();

  const auth = await getAuthContext(request);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const chunk = formData.get("chunk") as File | Blob | null;
    const finalizeOnly = formData.get("finalize") === "true";
    const uploadId = formData.get("uploadId") as string | null;
    const filename = formData.get("filename") as string | null;
    const totalChunks = Number.parseInt((formData.get("totalChunks") as string) || "0", 10);
    const chunkIndex = Number.parseInt((formData.get("chunkIndex") as string) || "-1", 10);
    const providedChunkChecksum =
      (formData.get("chunkChecksum") as string | null)?.toLowerCase().trim() || null;
    const fileType = (formData.get("fileType") as string | null) || "application/octet-stream";
    const settings = formData.get("settings") as string | null;
    const customDomain = formData.get("domain") as string | null;

    if (!uploadId || !filename || totalChunks <= 0) {
      return NextResponse.json({ error: "Missing required chunk fields" }, { status: 400 });
    }

    const uploadDir = path.join(CHUNK_TEMP_DIR, auth.userId, uploadId);
    await fs.mkdir(uploadDir, { recursive: true });

    if (!finalizeOnly) {
      if (!chunk || chunkIndex < 0) {
        return NextResponse.json({ error: "Missing chunk payload" }, { status: 400 });
      }

      const chunkPath = path.join(uploadDir, `${chunkIndex}.part`);
      const chunkBuffer = Buffer.from(await chunk.arrayBuffer());

      if (providedChunkChecksum) {
        const actualChunkChecksum = computeSha256Hex(chunkBuffer);
        if (actualChunkChecksum !== providedChunkChecksum) {
          return NextResponse.json({ error: "Chunk checksum mismatch" }, { status: 400 });
        }
      }

      await fs.writeFile(chunkPath, chunkBuffer);
    }

    const uploadedChunks = await getUploadedChunkIndexes(uploadDir);
    const allChunksUploaded = uploadedChunks.length >= totalChunks;

    if (!allChunksUploaded) {
      return NextResponse.json({
        uploadId,
        complete: false,
        uploadedChunks,
      });
    }

    const parts = await Promise.all(
      Array.from({ length: totalChunks }, async (_, index) => {
        const partPath = path.join(uploadDir, `${index}.part`);
        return fs.readFile(partPath);
      }),
    );
    const fullBuffer = Buffer.concat(parts);

    const fileBlob = new File([fullBuffer], filename, { type: fileType });

    const result = await finalizeUpload({
      file: fileBlob,
      originalName: filename,
      userId: auth.userId,
      isPremium: auth.isPremium,
      baseUrl: process.env.NEXTAUTH_URL || request.nextUrl.origin,
      rawSettings: settings,
      customDomain,
      fileId: uploadId,
    });

    await fs.rm(uploadDir, { recursive: true, force: true });

    return NextResponse.json({
      complete: true,
      ...result,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (
        error.message.includes("File too large") ||
        error.message.includes("Storage limit reached") ||
        error.message.includes("not allowed")
      ) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }

    console.error("Chunk upload error:", error);
    return NextResponse.json({ error: "Failed to process chunk upload" }, { status: 500 });
  }
}
