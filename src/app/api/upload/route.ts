import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import { uploadFile } from "@/lib/upload";
import { verifyApiKey } from "@/lib/auth";
import { MediaType } from "@prisma/client";
import { FILE_SIZE_LIMITS } from "@/lib/upload";
import { sendDiscordWebhook } from "@/lib/discord";
import { processFile } from "@/lib/process-file";
import { FileSettings } from "@/types/file-settings";
import { nanoid } from "nanoid";

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
    const file = formData.get("file") as File | Blob;
    const settings = JSON.parse(formData.get("settings") as string) as FileSettings;
    const customDomain = formData.get("domain") as string | null;
    const fileId = nanoid(6);

    console.log("File details:", {
      name: (file as any).name,
      type: file.type,
      size: file.size,
      fileId,
      settings,
      customDomain
    });

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const originalName = (file as any).name || 'untitled';
    const newFormat = settings.conversion.enabled && settings.conversion.format
      ? settings.conversion.format
      : originalName.split('.').pop();
    const newFilename = `${originalName.split('.')[0]}.${newFormat}`;

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

      "audio/mpeg",
      "audio/wav",
      "audio/ogg",
      "audio/mp3",
      "audio/aac",
      "audio/flac",
      "audio/m4a",

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

    console.log("Processing file...");
    const processedFile = await processFile(file, settings);
    console.log("File processed. New size:", processedFile.size);

    console.log("Uploading to R2...");
    const uploadResult = await uploadFile(
      processedFile,
      userId.toString(),
      newFilename,
      fileId
    );
    console.log("Upload result:", uploadResult);

    console.log("Creating database entry...");
    const dbData = {
      id: fileId,
      url: uploadResult.url,
      filename: uploadResult.filename,
      size: uploadResult.size,
      width: uploadResult.width,
      height: uploadResult.height,
      duration: uploadResult.duration || null,
      type: uploadResult.type.toUpperCase() as MediaType,
      userId,
      public: true,
      domain: customDomain || null,
    };
    console.log("Database entry data:", dbData);

    const [media, userSettings] = await Promise.all([
      prisma.media.create({
        data: dbData,
      }),
      prisma.settings.findUnique({
        where: { userId },
        select: { customDomain: true },
      }),
    ]);
    console.log("Database entry created:", media);
    console.log("User settings:", userSettings);

    const displayUrl = media.domain
      ? `https://${media.domain}/${media.id}`
      : userSettings?.customDomain
        ? `https://${userSettings.customDomain}/${media.id}`
        : media.url;
    console.log("Final display URL:", displayUrl);

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
    if (error instanceof Error) {
      console.error("Upload error details:", {
        name: error.name,
        message: error.message,
        stack: error.stack,
        cause: (error as any).cause,
      });
    } else {
      console.error("Unknown error:", error);
    }
    return NextResponse.json(
      { error: "Failed to upload media" },
      { status: 500 },
    );
  }
}
