import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { User } from "@prisma/client";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextResponse } from "next/server";

export async function verifyApiKey(apiKey: string): Promise<User | null> {
  if (!apiKey) return null;

  const key = await prisma.apiKey.findFirst({
    where: { key: apiKey },
    include: { user: true },
  });

  if (!key) return null;

  return key.user;
}

export async function adminMiddleware() {
  const session = await getServerSession(authOptions);

  if (!session?.user || !session.user.admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
}