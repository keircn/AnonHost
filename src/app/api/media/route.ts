import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import { verifyApiKey } from "@/lib/auth";
import { ArchiveProcessor } from "@/lib/archive-processor";
import { STORAGE_LIMITS } from "@/lib/upload";
import { uploadFile } from "@/lib/server/upload-file";
import {
  createDirectUploadForUser,
  finalizeDirectUploadForUser,
  markDirectUploadFailedForUser,
} from "@/lib/server/direct-upload";
import { ServerArchiveProcessor } from "@/lib/server-archive-processor";
import { apiKeys, MediaType, media, settings, users } from "@/lib/db/schema";
import { and, asc, desc, eq, gte, sql } from "drizzle-orm";
import { db } from "@/lib/db";

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
  createdAt: Date | null;
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
  try {
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

      await db.update(apiKeys).set({ lastUsed: new Date() }).where(eq(apiKeys.key, apiKey));
    } else {
      userId = session!.user.id.toString();
    }

    const baseUrl = process.env.NEXTAUTH_URL || "https://anonhost.cc";
    const url = new URL(req.url);
    const page = Math.max(1, Number.parseInt(url.searchParams.get("page") || "1"));
    const limit = Math.min(
      Math.max(1, Number.parseInt(url.searchParams.get("limit") || "20")),
      100,
    );
    const sort = url.searchParams.get("sort") || "createdAt";
    const order = url.searchParams.get("order") || "desc";
    const skip = (page - 1) * limit;

    const orderColumn =
      sort === "filename" ? media.filename : sort === "size" ? media.size : media.createdAt;
    const orderByExpr = order === "asc" ? asc(orderColumn) : desc(orderColumn);

    const [totalRow, mediaItems, storageRow, apiRequestsRow, userRow, settingsRow] =
      await Promise.all([
        db
          .select({ value: sql<number>`count(*)::int` })
          .from(media)
          .where(eq(media.userId, userId)),

        db
          .select()
          .from(media)
          .where(eq(media.userId, userId))
          .orderBy(orderByExpr)
          .offset(skip)
          .limit(limit),

        db
          .select({ value: sql<number>`coalesce(sum(${media.size}), 0)::int` })
          .from(media)
          .where(eq(media.userId, userId)),

        db
          .select({ value: sql<number>`count(*)::int` })
          .from(apiKeys)
          .where(
            and(
              eq(apiKeys.userId, userId),
              gte(apiKeys.lastUsed, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)),
            ),
          ),

        db
          .select({
            premium: users.premium,
            admin: users.admin,
            uid: users.uid,
            createdAt: users.createdAt,
          })
          .from(users)
          .where(eq(users.id, userId))
          .limit(1),

        db
          .select({
            customDomain: settings.customDomain,
            enableDirectLinks: settings.enableDirectLinks,
          })
          .from(settings)
          .where(eq(settings.userId, userId))
          .limit(1),
      ]);

    const total = totalRow[0]?.value ?? 0;
    const storageUsed = storageRow[0]?.value ?? 0;
    const apiRequests = apiRequestsRow[0]?.value ?? 0;
    const user = userRow[0] ?? null;
    const userSettings = settingsRow[0] ?? null;
    const storageLimit = user?.admin
      ? Number.MAX_SAFE_INTEGER
      : user?.premium
        ? STORAGE_LIMITS.PREMIUM
        : STORAGE_LIMITS.FREE;
    const directLinksEnabled = userSettings?.enableDirectLinks ?? true;

    return NextResponse.json<ApiResponse>({
      media: mediaItems.map(
        (item): MediaItemResponse => ({
          ...item,
          displayUrl: directLinksEnabled
            ? item.domain
              ? `https://${item.domain}/${item.id}`
              : userSettings?.customDomain
                ? `https://${userSettings.customDomain}/${item.id}`
                : `${baseUrl}/${item.id}`
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
        storageUsed,
        storageLimit,
        apiRequests,
        isAdmin: user?.admin || false,
        uid: Number(user?.uid || 0),
        createdAt: user?.createdAt || null,
      },
      baseUrl,
    });
  } catch (error) {
    console.error("GET /api/media failed:", {
      error,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json({ error: "Failed to load media" }, { status: 500 });
  }
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
    const requestContentType = req.headers.get("content-type") || "";

    if (requestContentType.includes("application/json")) {
      const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;

      if (!body || typeof body.action !== "string") {
        return NextResponse.json({ error: "Invalid direct upload action" }, { status: 400 });
      }

      try {
        if (body.action === "direct-init") {
          if (typeof body.fileName !== "string") {
            return NextResponse.json({ error: "fileName must be a string" }, { status: 400 });
          }
          if (typeof body.fileSize !== "number") {
            return NextResponse.json({ error: "fileSize must be a number" }, { status: 400 });
          }
          if (typeof body.contentType !== "string") {
            return NextResponse.json({ error: "contentType must be a string" }, { status: 400 });
          }

          const data = await createDirectUploadForUser({
            userId,
            fileName: body.fileName,
            fileSize: body.fileSize,
            contentType: body.contentType,
          });

          return NextResponse.json({ ok: true, data });
        }

        if (body.action === "direct-finalize") {
          if (typeof body.imageId !== "string") {
            return NextResponse.json({ error: "imageId must be a string" }, { status: 400 });
          }
          if (typeof body.objectKey !== "string") {
            return NextResponse.json({ error: "objectKey must be a string" }, { status: 400 });
          }

          const data = await finalizeDirectUploadForUser({
            userId,
            imageId: body.imageId,
            objectKey: body.objectKey,
            public: typeof body.public === "boolean" ? body.public : false,
            disableEmbed: typeof body.disableEmbed === "boolean" ? body.disableEmbed : false,
            domain: typeof body.domain === "string" ? body.domain : null,
          });

          return NextResponse.json({ ok: true, data });
        }

        if (body.action === "direct-fail") {
          if (typeof body.imageId !== "string") {
            return NextResponse.json({ error: "imageId must be a string" }, { status: 400 });
          }

          await markDirectUploadFailedForUser(userId, body.imageId);
          return NextResponse.json({ ok: true, data: null });
        }

        return NextResponse.json({ error: "Unknown direct upload action" }, { status: 400 });
      } catch (error) {
        return NextResponse.json(
          { error: error instanceof Error ? error.message : "Direct upload request failed" },
          { status: 400 },
        );
      }
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const type = formData.get("type") as "avatar" | "banner" | null;
    const filenameField = formData.get("filename") as string | null;
    const customDomain = formData.get("domain") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (type === "avatar" || type === "banner") {
      const uploadResult = await uploadFile(file, userId, file.name, crypto.randomUUID(), type);
      return NextResponse.json({
        url: uploadResult.url,
        filename: uploadResult.filename,
        type: uploadResult.type,
      });
    }

    const originalName = filenameField?.trim() || (file as File).name || "untitled";

    const uploadResult = await uploadFile(file, userId, originalName, crypto.randomUUID());

    let archiveMetadata = null;
    let archiveType = null;
    let fileCount = null;

    if (ServerArchiveProcessor.supportsPreview(originalName)) {
      try {
        const buffer = Buffer.from(await file.arrayBuffer());
        archiveMetadata = await ServerArchiveProcessor.processArchive(buffer, originalName);
        archiveType = archiveMetadata.archiveType;
        fileCount = archiveMetadata.totalFiles;
      } catch (error) {
        console.warn("Failed to process archive metadata:", error);
      }
    }

    const isArchiveUpload = ArchiveProcessor.isArchive(originalName);

    const media = await prisma.media.create({
      data: {
        url: uploadResult.url,
        filename: uploadResult.filename,
        size: uploadResult.size,
        width: uploadResult.width,
        height: uploadResult.height,
        duration: uploadResult.duration,
        type: (isArchiveUpload ? "ARCHIVE" : uploadResult.type.toUpperCase()) as MediaType,
        userId,
        public: formData.get("public") === "true",
        domain: customDomain || null,
        archiveType,
        fileCount,
        archiveMeta: archiveMetadata ? (archiveMetadata as any) : null,
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
    return NextResponse.json({ error: "Failed to upload media" }, { status: 500 });
  }
}
