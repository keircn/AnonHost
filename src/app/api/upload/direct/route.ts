import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { eq } from "drizzle-orm";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { verifyApiKey } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiKeys } from "@/lib/db/schema";
import { createDirectUploadForUser } from "@/lib/server/direct-upload";

type CreateDirectUploadBody = {
  fileName?: unknown;
  fileSize?: unknown;
  contentType?: unknown;
};

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const apiKey = request.headers.get("authorization")?.split("Bearer ")[1];

  if (!session && !apiKey) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  let userId: string;

  if (apiKey) {
    const user = await verifyApiKey(apiKey);
    if (!user) {
      return NextResponse.json({ ok: false, error: "Invalid API key" }, { status: 401 });
    }
    userId = user.id.toString();
    await db.update(apiKeys).set({ lastUsed: new Date() }).where(eq(apiKeys.key, apiKey));
  } else {
    userId = session!.user.id.toString();
  }

  const body = (await request.json().catch(() => null)) as CreateDirectUploadBody | null;

  if (!body) {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  if (typeof body.fileName !== "string") {
    return NextResponse.json({ ok: false, error: "fileName must be a string" }, { status: 400 });
  }

  if (typeof body.fileSize !== "number") {
    return NextResponse.json({ ok: false, error: "fileSize must be a number" }, { status: 400 });
  }

  if (typeof body.contentType !== "string") {
    return NextResponse.json({ ok: false, error: "contentType must be a string" }, { status: 400 });
  }

  try {
    const data = await createDirectUploadForUser({
      userId,
      fileName: body.fileName,
      fileSize: body.fileSize,
      contentType: body.contentType,
    });

    return NextResponse.json({ ok: true, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create upload URL";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
