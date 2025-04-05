import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import { verifyApiKey } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const id = params.id;
  const session = await getServerSession(authOptions);
  const apiKey = req.headers.get("authorization")?.split("Bearer ")[1];
  const baseUrl = process.env.NEXTAUTH_URL;

  if (!session && !apiKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let userId: bigint;

  if (apiKey) {
    const user = await verifyApiKey(apiKey);
    if (!user) {
      return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
    }
    userId = BigInt(user.id);

    await prisma.apiKey.update({
      where: { key: apiKey },
      data: { lastUsed: new Date() },
    });
  } else {
    userId = BigInt(session!.user.id);
  }

  try {
    const shortlink = await prisma.shortlink.findUnique({
      where: {
        id,
      },
    });

    if (!shortlink) {
      return NextResponse.json(
        { error: "Shortlink not found" },
        { status: 404 },
      );
    }

    if (shortlink.userId !== userId && !session?.user.admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    return NextResponse.json({
      id: shortlink.id,
      originalUrl: shortlink.originalUrl,
      title: shortlink.title,
      shortUrl: `${baseUrl}/s/${shortlink.id}`,
      clicks: shortlink.clicks,
      public: shortlink.public,
      createdAt: shortlink.createdAt,
      expireAt: shortlink.expireAt,
    });
  } catch (error) {
    console.error("Error fetching shortlink:", error);
    return NextResponse.json(
      { error: "Failed to fetch shortlink" },
      { status: 500 },
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const id = params.id;
  const session = await getServerSession(authOptions);
  const apiKey = req.headers.get("authorization")?.split("Bearer ")[1];
  const baseUrl = process.env.NEXTAUTH_URL;

  if (!session && !apiKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let userId: bigint;

  if (apiKey) {
    const user = await verifyApiKey(apiKey);
    if (!user) {
      return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
    }
    userId = BigInt(user.id);

    await prisma.apiKey.update({
      where: { key: apiKey },
      data: { lastUsed: new Date() },
    });
  } else {
    userId = BigInt(session!.user.id);
  }

  try {
    const shortlink = await prisma.shortlink.findUnique({
      where: {
        id,
      },
    });

    if (!shortlink) {
      return NextResponse.json(
        { error: "Shortlink not found" },
        { status: 404 },
      );
    }

    if (shortlink.userId !== userId && !session?.user.admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { title, originalUrl, public: isPublic, expiresIn } = body;

    let expireAt: Date | null = null;
    if (expiresIn) {
      expireAt = new Date();
      expireAt.setDate(expireAt.getDate() + parseInt(expiresIn));
    }

    if (originalUrl) {
      try {
        new URL(originalUrl);
      } catch {
        return NextResponse.json(
          { error: "Invalid URL format" },
          { status: 400 },
        );
      }
    }

    const updatedShortlink = await prisma.shortlink.update({
      where: {
        id,
      },
      data: {
        title: title !== undefined ? title : shortlink.title,
        originalUrl: originalUrl || shortlink.originalUrl,
        public: isPublic !== undefined ? isPublic : shortlink.public,
        expireAt: expiresIn !== undefined ? expireAt : shortlink.expireAt,
      },
    });

    return NextResponse.json({
      id: updatedShortlink.id,
      originalUrl: updatedShortlink.originalUrl,
      title: updatedShortlink.title,
      shortUrl: `${baseUrl}/s/${updatedShortlink.id}`,
      clicks: updatedShortlink.clicks,
      public: updatedShortlink.public,
      createdAt: updatedShortlink.createdAt,
      expireAt: updatedShortlink.expireAt,
    });
  } catch (error) {
    console.error("Error updating shortlink:", error);
    return NextResponse.json(
      { error: "Failed to update shortlink" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const id = params.id;
  const session = await getServerSession(authOptions);
  const apiKey = req.headers.get("authorization")?.split("Bearer ")[1];

  if (!session && !apiKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let userId: bigint;

  if (apiKey) {
    const user = await verifyApiKey(apiKey);
    if (!user) {
      return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
    }
    userId = BigInt(user.id);

    await prisma.apiKey.update({
      where: { key: apiKey },
      data: { lastUsed: new Date() },
    });
  } else {
    userId = BigInt(session!.user.id);
  }

  try {
    const shortlink = await prisma.shortlink.findUnique({
      where: {
        id,
      },
    });

    if (!shortlink) {
      return NextResponse.json(
        { error: "Shortlink not found" },
        { status: 404 },
      );
    }

    if (shortlink.userId !== userId && !session?.user.admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await prisma.shortlink.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({ message: "Shortlink deleted successfully" });
  } catch (error) {
    console.error("Error deleting shortlink:", error);
    return NextResponse.json(
      { error: "Failed to delete shortlink" },
      { status: 500 },
    );
  }
}
