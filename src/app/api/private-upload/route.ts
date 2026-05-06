import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { verifyApiKey } from "@/lib/auth";
import { createPrivateUpload } from "@/lib/server/private-upload";
import { db } from "@/lib/db";
import { apiKeys } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const apiKey = request.headers.get("authorization")?.split("Bearer ")[1];

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
    isPremium = Boolean(user.premium);
    await db.update(apiKeys).set({ lastUsed: new Date() }).where(eq(apiKeys.key, apiKey));
  } else {
    userId = session!.user.id.toString();
    isPremium = Boolean(session!.user.premium);
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
      userId,
      isPremium,
      baseUrl: process.env.NEXTAUTH_URL || request.nextUrl.origin,
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create private upload";
    const status = message.includes("large") || message.includes("required") ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
