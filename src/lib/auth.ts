import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { DbUser } from "@/lib/db/schema";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiKeys, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function verifyApiKey(apiKey: string): Promise<DbUser | null> {
  if (!apiKey) return null;

  const [row] = await db
    .select({ user: users })
    .from(apiKeys)
    .innerJoin(users, eq(apiKeys.userId, users.id))
    .where(eq(apiKeys.key, apiKey))
    .limit(1);

  return row?.user ?? null;
}

export async function adminMiddleware() {
  const session = await getServerSession(authOptions);

  if (!session?.user || !session.user.admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  return null;
}
