import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { verifyApiKey } from "@/lib/auth";
import { createPrivateUpload } from "@/lib/server/private-upload";
import { db } from "@/lib/db";
import { apiKeys } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { listPrivateUploadsForUser } from "@/lib/server/private-upload";

async function authenticatePrivateUploadRequest(request: NextRequest) {
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
    await db.update(apiKeys).set({ lastUsed: new Date() }).where(eq(apiKeys.key, apiKey));
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

export async function GET(request: NextRequest) {
  const auth = await authenticatePrivateUploadRequest(request);

  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const baseUrl = process.env.NEXTAUTH_URL || request.nextUrl.origin;
    const uploads = await listPrivateUploadsForUser(auth.userId, baseUrl);
    return NextResponse.json({ uploads, total: uploads.length });
  } catch (error) {
    console.error("Failed to list private uploads:", error);
    return NextResponse.json({ error: "Failed to load private uploads" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await authenticatePrivateUploadRequest(request);

  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | Blob | null;
    const password = formData.get("password");
    const oneUse = formData.get("oneUse") === "true";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (typeof password !== "string") {
      return NextResponse.json({ error: "Password is required" }, { status: 400 });
    }

    const result = await createPrivateUpload({
      file,
      originalName: (file as File).name || "private-upload",
      password,
      oneUse,
      userId: auth.userId,
      isPremium: auth.isPremium,
      baseUrl: process.env.NEXTAUTH_URL || request.nextUrl.origin,
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create private upload";
    const status = message.includes("large") || message.includes("required") ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
