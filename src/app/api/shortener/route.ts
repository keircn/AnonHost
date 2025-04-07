import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import { verifyApiKey } from "@/lib/auth";
import type { Session } from "next-auth";

export async function GET(req: NextRequest) {
  const session = (await getServerSession(authOptions)) as Session | null;
  const apiKey = req.headers.get("authorization")?.split("Bearer ")[1];

  if (!session && !apiKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let userId: string;

  if (apiKey) {
    const user = await verifyApiKey(apiKey);
    if (!user) {
      return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
    }
    userId = user.id;

    await prisma.apiKey.update({
      where: { key: apiKey },
      data: { lastUsed: new Date() },
    });
  } else {
    userId = session!.user.id;
  }

  try {
    const shortlinks = await prisma.shortlink.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      shortlinks,
      count: shortlinks.length,
    });
  } catch (error) {
    console.error("Error fetching shortlinks:", error);
    return NextResponse.json(
      { error: "Failed to fetch shortlinks" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const apiKey = req.headers.get("authorization")?.split("Bearer ")[1];
  const baseUrl = process.env.NEXTAUTH_URL || "https://keiran.cc";

  if (!session && !apiKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let userId: string;

  if (apiKey) {
    const user = await verifyApiKey(apiKey);
    if (!user) {
      return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
    }
    userId = user.id;

    await prisma.apiKey.update({
      where: { key: apiKey },
      data: { lastUsed: new Date() },
    });
  } else {
    userId = session!.user.id;
  }

  try {
    const body = await req.json();
    const { originalUrl, title, expiresIn, public: isPublic } = body;

    if (!originalUrl) {
      return NextResponse.json(
        { error: "Original URL is required" },
        { status: 400 },
      );
    }

    try {
      const url = new URL(originalUrl);
      if (!['http:', 'https:'].includes(url.protocol)) {
        return NextResponse.json(
          { error: "URL must use HTTP or HTTPS protocol" },
          { status: 400 },
        );
      }
    } catch (urlError) {
      return NextResponse.json(
        { 
          error: "Invalid URL format",
          details: "Please provide a valid URL including protocol (e.g., https://example.com)" 
        },
        { status: 400 },
      );
    }

    let expireAt: Date | null = null;
    if (expiresIn) {
      expireAt = new Date();
      expireAt.setDate(expireAt.getDate() + parseInt(expiresIn));
    }

    const shortlink = await prisma.shortlink.create({
      data: {
        originalUrl,
        title: title || null,
        userId,
        public: isPublic || false,
        expireAt: expireAt,
      },
    });

    return NextResponse.json({
      id: shortlink.id,
      originalUrl: shortlink.originalUrl,
      title: shortlink.title,
      shortUrl: new URL(`/s/${shortlink.id}`, baseUrl).toString(),
      public: shortlink.public,
      createdAt: shortlink.createdAt,
      expireAt: shortlink.expireAt,
    });
  } catch (error) {
    console.error("Error creating shortlink:", error);
    return NextResponse.json(
      { error: "Failed to create shortlink" },
      { status: 500 },
    );
  }
}
