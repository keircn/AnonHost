import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import { verifyApiKey } from "@/lib/auth";
import { uploadImage, STORAGE_LIMITS } from "@/lib/upload";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const apiKey = req.headers.get("authorization")?.split("Bearer ")[1];

  if (!session && !apiKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let userId: number;

  if (apiKey) {
    const user = await verifyApiKey(apiKey);
    if (!user) {
      return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
    }
    userId = Number(user.id);

    await prisma.apiKey.update({
      where: { key: apiKey },
      data: { lastUsed: new Date() },
    });
  } else {
    userId = session!.user.id;
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

  const [total, images, storageStats, apiRequests, user, settings] =
    await Promise.all([
      prisma.image.count({
        where: { userId },
      }),

      prisma.image.findMany({
        where: { userId },
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

      prisma.image.aggregate({
        where: { userId },
        _sum: {
          size: true,
        },
      }),

      prisma.apiKey.count({
        where: {
          userId,
          lastUsed: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),

      prisma.user.findUnique({
        where: { id: userId },
        select: { premium: true, admin: true },
      }),

      prisma.settings.findUnique({
        where: { userId },
        select: { customDomain: true },
      }),
    ]);

  const storageUsed = storageStats._sum.size || 0;
  const storageLimit = user?.admin
    ? Number.MAX_SAFE_INTEGER
    : user?.premium
      ? STORAGE_LIMITS.PREMIUM
      : STORAGE_LIMITS.FREE;

  return NextResponse.json({
    images: images.map((image) => ({
      ...image,
      displayUrl: image.domain
        ? `https://${image.domain}/${image.id}`
        : settings?.customDomain
          ? `https://${settings.customDomain}/${image.id}`
          : `${baseUrl}/${image.id}`,
    })),
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

  let userId: number;

  if (apiKey) {
    const user = await verifyApiKey(apiKey);
    if (!user) {
      return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
    }
    userId = Number(user.id);

    await prisma.apiKey.update({
      where: { key: apiKey },
      data: { lastUsed: new Date() },
    });
  } else {
    userId = session!.user.id;
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const customDomain = formData.get("domain") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const uploadResult = await uploadImage(file, userId.toString());

    const image = await prisma.image.create({
      data: {
        url: uploadResult.url,
        filename: uploadResult.filename,
        size: uploadResult.size,
        width: uploadResult.width,
        height: uploadResult.height,
        userId,
        public: formData.get("public") === "true",
        domain: customDomain || null,
      },
    });

    const imageUrl = image.domain
      ? `https://${image.domain}/${image.id}`
      : `${baseUrl}/${image.id}`;

    return NextResponse.json({
      id: image.id,
      url: imageUrl,
      filename: image.filename,
      size: image.size,
      width: image.width,
      height: image.height,
      public: image.public,
      domain: image.domain,
      createdAt: image.createdAt,
      baseUrl: baseUrl,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload image" },
      { status: 500 },
    );
  }
}
