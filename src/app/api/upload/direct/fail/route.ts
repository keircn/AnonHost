import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { eq } from "drizzle-orm";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { verifyApiKey } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiKeys } from "@/lib/db/schema";
import { markDirectUploadFailedForUser } from "@/lib/server/direct-upload";

type FailBody = {
  imageId?: unknown;
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

  const body = (await request.json().catch(() => null)) as FailBody | null;

  if (!body) {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  if (typeof body.imageId !== "string") {
    return NextResponse.json({ ok: false, error: "imageId must be a string" }, { status: 400 });
  }

  try {
    await markDirectUploadFailedForUser(userId, body.imageId);
    return NextResponse.json({ ok: true, data: null });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to mark upload as failed";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
