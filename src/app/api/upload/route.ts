import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import { uploadFile } from "@/lib/upload";
import { verifyApiKey } from "@/lib/auth";
import { MediaType } from "@prisma/client";
import { FILE_SIZE_LIMITS } from "@/lib/upload";
import { sendDiscordWebhook } from "@/lib/discord";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const apiKey = req.headers.get("authorization")?.split("Bearer ")[1];
  const baseUrl = process.env.NEXTAUTH_URL;

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
    isPremium = user.premium;

    await prisma.apiKey.update({
      where: { key: apiKey },
      data: { lastUsed: new Date() },
    });
  } else {
    userId = session!.user.id.toString();
    isPremium = session!.user.premium || false;
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const customDomain = formData.get("domain") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const sizeLimit = isPremium
      ? FILE_SIZE_LIMITS.PREMIUM
      : FILE_SIZE_LIMITS.FREE;
    if (file.size > sizeLimit) {
      const limitInMb = sizeLimit / (1024 * 1024);
      return NextResponse.json(
        {
          error: `File too large. Maximum file size is ${limitInMb}MB for ${isPremium ? "premium" : "free"} users`,
        },
        { status: 400 },
      );
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",

      "video/mp4",
      "video/webm",
      "video/ogg",

      "text/plain",
      "text/markdown",
      "text/html",
      "text/css",
      "text/javascript",
      "application/json",
      "application/xml",

      "application/pdf",
      "application/x-httpd-php",
      "application/x-sh",
      "application/x-yaml",
      "application/x-typescript",
      "application/x-markdown",
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          error: "Invalid file type.",
        },
        { status: 400 },
      );
    }

    const uploadResult = await uploadFile(file, userId.toString());

    const [media, settings] = await Promise.all([
      prisma.media.create({
        data: {
          url: uploadResult.url,
          filename: uploadResult.filename,
          size: uploadResult.size,
          width: uploadResult.width,
          height: uploadResult.height,
          duration: uploadResult.duration,
          type: uploadResult.type.toUpperCase() as MediaType,
          userId,
          public: true,
          domain: customDomain || null,
        },
      }),
      prisma.settings.findUnique({
        where: { userId },
        select: { customDomain: true },
      }),
    ]);

    const displayUrl = media.domain
      ? `https://${media.domain}/${media.id}`
      : settings?.customDomain
        ? `https://${settings.customDomain}/${media.id}`
        : `${baseUrl}/${media.id}`;

    await sendDiscordWebhook({
      content: displayUrl,
    });

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
