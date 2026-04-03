import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { randomBytes } from "node:crypto";
import { db } from "@/lib/db";
import { apiKeys } from "@/lib/db/schema";
import { count, desc, eq } from "drizzle-orm";

function generateApiKey(username: string) {
  const prefix = username?.toLowerCase().replace(/[^a-z0-9]/g, "") || "anon";
  return `${prefix}_${randomBytes(16).toString("hex")}`;
}

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  const keys = await db
    .select()
    .from(apiKeys)
    .where(eq(apiKeys.userId, userId))
    .orderBy(desc(apiKeys.createdAt));

  return NextResponse.json(keys);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    const [{ value: keyCount }] = await db
      .select({ value: count() })
      .from(apiKeys)
      .where(eq(apiKeys.userId, userId));

    if (keyCount >= 10) {
      return NextResponse.json(
        { error: "Maximum number of API keys (10) reached" },
        { status: 400 },
      );
    }

    const { name } = await req.json();

    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const key = generateApiKey(session.user.name || "");

    const [apiKey] = await db
      .insert(apiKeys)
      .values({
        name,
        key,
        userId,
      })
      .returning();

    return NextResponse.json(apiKey);
  } catch (error) {
    console.error("Failed to create API key:", error);
    return NextResponse.json({ error: "Failed to create API key" }, { status: 500 });
  }
}
