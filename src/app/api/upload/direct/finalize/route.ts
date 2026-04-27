import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { eq } from "drizzle-orm";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { verifyApiKey } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiKeys } from "@/lib/db/schema";
import { finalizeDirectUploadForUser } from "@/lib/server/direct-upload";

type FinalizeBody = {
  imageId?: unknown;
  objectKey?: unknown;
  public?: unknown;
  disableEmbed?: unknown;
  domain?: unknown;
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

  const body = (await request.json().catch(() => null)) as FinalizeBody | null;

  if (!body) {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  if (typeof body.imageId !== "string") {
    return NextResponse.json({ ok: false, error: "imageId must be a string" }, { status: 400 });
  }

  if (typeof body.objectKey !== "string") {
    return NextResponse.json({ ok: false, error: "objectKey must be a string" }, { status: 400 });
  }

  try {
    const data = await finalizeDirectUploadForUser({
      userId,
      imageId: body.imageId,
      objectKey: body.objectKey,
      public: typeof body.public === "boolean" ? body.public : false,
      disableEmbed: typeof body.disableEmbed === "boolean" ? body.disableEmbed : false,
      domain: typeof body.domain === "string" ? body.domain : null,
    });

    return NextResponse.json({ ok: true, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload could not be finalized";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
