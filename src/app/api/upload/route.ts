import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import { uploadImage } from "@/lib/upload";
import { verifyApiKey } from "@/lib/auth";
import { FILE_SIZE_LIMITS, STORAGE_LIMITS } from "@/lib/upload";
import { getImageDimensions } from "@/app/actions/process-image";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const apiKey = req.headers.get("authorization")?.split("Bearer ")[1];
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://keiran.cc";

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
    const settings = await prisma.settings.findUnique({
      where: { userId },
    });

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const buffer = Buffer.from(await file.arrayBuffer());

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { premium: true, admin: true },
    });

    const sizeLimit = user?.admin
      ? Number.MAX_SAFE_INTEGER
      : user?.premium
        ? FILE_SIZE_LIMITS.PREMIUM
        : FILE_SIZE_LIMITS.FREE;

    if (file.size > sizeLimit && !user?.admin) {
      const limitInMb = sizeLimit / (1024 * 1024);
      return NextResponse.json(
        {
          error: `File too large. Maximum size is ${limitInMb}MB for ${user?.premium ? "premium" : "free"
            } users`,
        },
        { status: 400 },
      );
    }

    const userImages = await prisma.image.findMany({
      where: { userId: userId },
      select: { size: true },
    });

    const currentStorageUsed = userImages.reduce(
      (total, img) => total + (img.size || 0),
      0,
    );

    const storageLimit = user?.admin
      ? Number.MAX_SAFE_INTEGER
      : user?.premium
        ? STORAGE_LIMITS.PREMIUM
        : STORAGE_LIMITS.FREE;

    if (currentStorageUsed + file.size > storageLimit && !user?.admin) {
      return NextResponse.json(
        {
          error: "Storage limit exceeded",
          currentStorage: currentStorageUsed,
          limit: storageLimit,
          remaining: storageLimit - currentStorageUsed,
          formattedLimit: storageLimit,
          formattedUsed: currentStorageUsed,
          formattedRemaining: storageLimit - currentStorageUsed,
        },
        { status: 400 },
      );
    }

    const dimensions = await getImageDimensions(buffer);
    const uploadResult = await uploadImage(file, userId.toString());

    const image = await prisma.image.create({
      data: {
        url: uploadResult.url,
        filename: uploadResult.filename,
        size: uploadResult.size,
        width: dimensions.width,
        height: dimensions.height,
        userId: userId,
        public: formData.get("public") === "true",
      },
    });

    const imageUrl = settings?.customDomain
      ? `https://${settings.customDomain}/${image.id}`
      : `${baseUrl}/${image.id}`;

    return NextResponse.json({
      url: imageUrl,
      id: image.id,
      createdAt: image.createdAt,
      filename: image.filename,
      size: image.size,
      public: image.public,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload image" },
      { status: 500 },
    );
  }
}
