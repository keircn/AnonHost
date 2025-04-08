import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import { verifyApiKey } from "@/lib/auth";
import { uploadFile, STORAGE_LIMITS } from "@/lib/upload";
import { MediaType } from "@prisma/client";

interface MediaItem {
  id: string;
  domain: string | null;
  displayUrl: string;
}

interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

interface StatsInfo {
  totalUploads: number;
  storageUsed: number;
  storageLimit: number;
  apiRequests: number;
  isAdmin: boolean;
  uid: number;
}

interface ApiResponse {
  media: MediaItem[];
  pagination: PaginationInfo;
  stats: StatsInfo;
  baseUrl: string;
}

interface MediaItemResponse extends MediaItem {
  displayUrl: string;
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
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
    userId = user.id.toString();

    await prisma.apiKey.update({
      where: { key: apiKey },
      data: { lastUsed: new Date() },
    });
  } else {
    userId = session!.user.id.toString();
  }

  const baseUrl = process.env.NEXTAUTH_URL || "https://keiran.cc";
  const url = new URL(req.url);
  const page = Number.parseInt(url.searchParams.get("page") || "1");
  const limit = Math.min(
    Number.parseInt(url.searchParams.get("limit") || "20"),
    100,
  );
  const sort = url.searchParams.get("sort") || "createdAt";
  const order = url.searchParams.get("order") || "desc";

  const skip = (page - 1) * limit;

  const [total, mediaItems, storageStats, apiRequests, user, settings] =
    await Promise.all([
      prisma.media.count({
        where: { userId: userId.toString() },
      }),

      prisma.media.findMany({
        where: { userId: userId.toString() },
        orderBy: {
          [sort === "filename"
            ? "filename"
            : sort === "size"
              ? "size"
              : "createdAt"]: order === "asc" ? "asc" : "desc",
        },
        skip,
        take: limit,
      }),

      prisma.media.aggregate({
        where: { userId: userId.toString() },
        _sum: {
          size: true,
        },
      }),

      prisma.apiKey.count({
        where: {
          userId: userId.toString(),
          lastUsed: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),

      prisma.user.findUnique({
        where: { id: userId.toString() },
        select: { 
          premium: true, 
          admin: true,
          uid: true
        },
      }),

      prisma.settings.findUnique({
        where: { userId: userId.toString() },
        select: { customDomain: true },
      }),
    ]);

  const storageUsed = storageStats._sum?.size ?? 0;
  const storageLimit = user?.admin
    ? Number.MAX_SAFE_INTEGER
    : user?.premium
      ? STORAGE_LIMITS.PREMIUM
      : STORAGE_LIMITS.FREE;

  return NextResponse.json<ApiResponse>({
    media: mediaItems.map(
      (item: { id: string; domain: string | null }): MediaItemResponse => ({
        ...item,
        displayUrl: item.domain
          ? `https://${item.domain}/${item.id}`
          : settings?.customDomain
            ? `https://${settings.customDomain}/${item.id}`
            : `${baseUrl}/${item.id}`,
      }),
    ),
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
    stats: {
      totalUploads: total,
      storageUsed: storageUsed,
      storageLimit: storageLimit,
      apiRequests,
      isAdmin: user?.admin || false,
      uid: user?.uid || 0
    },
    baseUrl,
  });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const apiKey = req.headers.get("authorization")?.split("Bearer ")[1];
  const baseUrl = process.env.NEXTAUTH_URL;

  if (!session && !apiKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let userId: string;

  if (apiKey) {
    const user = await verifyApiKey(apiKey);
    if (!user) {
      return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
    }
    userId = user.id.toString();

    await prisma.apiKey.update({
      where: { key: apiKey },
      data: { lastUsed: new Date() },
    });
  } else {
    userId = session!.user.id.toString();
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const customDomain = formData.get("domain") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const uploadResult = await uploadFile(file, userId.toString());

    const media = await prisma.media.create({
      data: {
        url: uploadResult.url,
        filename: uploadResult.filename,
        size: uploadResult.size,
        width: uploadResult.width,
        height: uploadResult.height,
        duration: uploadResult.duration,
        type: uploadResult.type.toUpperCase() as MediaType,
        userId,
        public: formData.get("public") === "true",
        domain: customDomain || null,
      },
    });

    const settings = await prisma.settings.findUnique({
      where: { userId },
      select: { customDomain: true },
    });

    const displayUrl = media.domain
      ? `https://${media.domain}/${media.id}`
      : settings?.customDomain
        ? `https://${settings.customDomain}/${media.id}`
        : `${baseUrl}/${media.id}`;

    return NextResponse.json({
      id: media.id,
      url: displayUrl,
      filename: media.filename,
      size: media.size,
      width: media.width,
      height: media.height,
      duration: media.duration,
      type: media.type,
      public: media.public,
      domain: media.domain,
      createdAt: media.createdAt,
      baseUrl: baseUrl,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload media" },
      { status: 500 },
    );
  }
}
