import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import { verifyApiKey } from "@/lib/auth";
import { finalizeUpload } from "@/lib/server/upload-finalizer";

function isErrorWithCause(error: unknown): error is { cause: unknown } {
  return typeof error === "object" && error !== null && "cause" in error;
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const apiKey = req.headers.get("authorization")?.split("Bearer ")[1];
  const baseUrl = process.env.NEXTAUTH_URL;

  if (!session && !apiKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let userId: string;
  let isPremium = false;

  if (apiKey) {
    const user = await verifyApiKey(apiKey);
    if (!user) {
      return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
    }
    userId = user.id.toString();
    isPremium = user.premium;

    await prisma.apiKey.update({
      where: { key: apiKey },
      data: { lastUsed: new Date() },
    });
  } else {
    userId = session!.user.id.toString();
    isPremium = session!.user.premium || false;
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | Blob;
    const settingsStr = formData.get("settings") as string | null;
    const customDomain = formData.get("domain") as string | null;
    const clientFileId = formData.get("fileId") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const originalName = (file as File).name || "untitled";

    const result = await finalizeUpload({
      file,
      originalName,
      userId,
      isPremium,
      baseUrl: baseUrl || req.nextUrl.origin,
      rawSettings: settingsStr,
      customDomain,
      fileId: clientFileId || undefined,
    });

    return NextResponse.json(result);
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

    if (error instanceof Error) {
      console.error("Error details:", {
        name: error.name,
        message: error.message,
        stack: error.stack,
        cause: isErrorWithCause(error) ? error.cause : undefined,
      });
    } else {
      console.error("Unknown error:", error);
    }
    return NextResponse.json({ error: "Failed to upload media" }, { status: 500 });
  }
}
