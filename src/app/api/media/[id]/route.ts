import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import { promises as fs } from "fs";
import path from "path";
import { deleteFromR2Key, isR2Configured } from "@/lib/r2";

export async function DELETE(req: NextRequest, context: { params: { id: string } }) {
  const { id } = await context.params;
  const session = await getServerSession(authOptions);
  const apiKey = req.headers.get("authorization")?.split("Bearer ")[1];

  if (!session && !apiKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = apiKey
    ? ((
        await prisma.apiKey.findUnique({
          where: { key: apiKey },
          select: { userId: true },
        })
      )?.userId ?? "")
    : session!.user.id;

  if (!userId) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  try {
    const media = await prisma.media.findUnique({
      where: { id },
      select: { userId: true, url: true, size: true },
    });

    if (!media) {
      return NextResponse.json({ error: "Media not found" }, { status: 404 });
    }

    if (media.userId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const shouldDeleteFromR2 =
      isR2Configured() &&
      Boolean(process.env.R2_PUBLIC_URL) &&
      media.url.startsWith(process.env.R2_PUBLIC_URL!);

    const storageDeleteTask = shouldDeleteFromR2
      ? deleteFromR2(media.url)
      : deleteFromLocalStorage(media.url);

    await Promise.all([
      storageDeleteTask.catch((error) => {
        console.warn("Storage delete failed; continuing with DB delete:", error);
      }),
      prisma.media.delete({ where: { id } }),
      prisma.user.update({
        where: { id: userId.toString() },
        data: { storageUsed: { decrement: media.size } },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json({ error: "Failed to delete media" }, { status: 500 });
  }
}

async function deleteFromR2(mediaUrl: string) {
  const publicUrl = process.env.R2_PUBLIC_URL!;
  const key = mediaUrl.replace(`${publicUrl}/`, "");
  await deleteFromR2Key(key);
}

async function deleteFromLocalStorage(mediaUrl: string) {
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const pathname = new URL(mediaUrl, baseUrl).pathname;

  let relativePath: string | null = null;
  if (pathname.startsWith("/api/upload/storage/")) {
    relativePath = pathname.replace("/api/upload/storage/", "");
  } else if (pathname.startsWith("/uploads/")) {
    relativePath = pathname.replace("/uploads/", "");
  }

  if (!relativePath) {
    return;
  }

  const fullPath = path.join(process.cwd(), "uploads", ...relativePath.split("/"));
  const normalizedPath = path.normalize(fullPath);
  const uploadDir = path.join(process.cwd(), "uploads");

  if (!normalizedPath.startsWith(uploadDir)) {
    throw new Error("Invalid local media path");
  }

  try {
    await fs.unlink(normalizedPath);
  } catch (error: unknown) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code: string }).code === "ENOENT"
    ) {
      return;
    }
    throw error;
  }
}
