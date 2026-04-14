import prisma from "@/lib/prisma";
import { BLOCKED_TYPES, FILE_SIZE_LIMITS, STORAGE_LIMITS } from "@/lib/upload";
import { uploadFile } from "@/lib/server/upload-file";
import { sendDiscordWebhook } from "@/lib/discord";
import { processFile } from "@/lib/process-file";
import { ArchiveProcessor } from "@/lib/archive-processor";
import { ServerArchiveProcessor } from "@/lib/server-archive-processor";
import { MediaType } from "@/lib/db/schema";
import type { FileSettings } from "@/types/file-settings";
import { nanoid } from "nanoid";

function getDefaultSettings(userDefaults: {
  makeImagesPublic: boolean;
  disableEmbedByDefault: boolean;
}): FileSettings {
  return {
    conversion: {
      enabled: false,
      format: undefined,
    },
    public: userDefaults.makeImagesPublic,
    disableEmbed: userDefaults.disableEmbedByDefault,
    stripMetadata: true,
    optimizeForWeb: true,
    compression: {
      enabled: false,
      quality: 80,
    },
    resize: {
      enabled: false,
      width: undefined,
      height: undefined,
      maintainAspectRatio: true,
      fit: "inside",
    },
  };
}

function parseSettings(
  rawSettings: string | FileSettings | null | undefined,
  userDefaults: { makeImagesPublic: boolean; disableEmbedByDefault: boolean },
): FileSettings {
  const defaults = getDefaultSettings(userDefaults);

  if (!rawSettings) {
    return defaults;
  }

  try {
    const parsed = typeof rawSettings === "string" ? JSON.parse(rawSettings) : rawSettings;

    return {
      conversion: {
        enabled: parsed?.conversion?.enabled ?? false,
        format: parsed?.conversion?.format ?? undefined,
      },
      public: parsed?.public ?? userDefaults.makeImagesPublic,
      disableEmbed: parsed?.disableEmbed ?? userDefaults.disableEmbedByDefault,
      stripMetadata: parsed?.stripMetadata ?? true,
      optimizeForWeb: parsed?.optimizeForWeb ?? true,
      compression: {
        enabled: parsed?.compression?.enabled ?? false,
        quality: parsed?.compression?.quality ?? 80,
      },
      resize: {
        enabled: parsed?.resize?.enabled ?? false,
        width: parsed?.resize?.width ?? undefined,
        height: parsed?.resize?.height ?? undefined,
        maintainAspectRatio: parsed?.resize?.maintainAspectRatio ?? true,
        fit: parsed?.resize?.fit ?? "inside",
      },
    };
  } catch (error) {
    console.warn("Failed to parse file settings:", error);
    return defaults;
  }
}

function buildConvertedFilename(originalName: string, settings: FileSettings): string {
  const dotIndex = originalName.lastIndexOf(".");
  const basename = dotIndex > 0 ? originalName.slice(0, dotIndex) : originalName;
  const originalExt = dotIndex > 0 ? originalName.slice(dotIndex + 1) : "";
  const targetExt =
    settings.conversion.enabled && settings.conversion.format
      ? settings.conversion.format
      : originalExt;

  return targetExt ? `${basename}.${targetExt}` : basename;
}

export interface FinalizeUploadInput {
  file: File | Blob;
  originalName: string;
  userId: string;
  isPremium: boolean;
  baseUrl: string;
  rawSettings?: string | FileSettings | null;
  customDomain?: string | null;
  fileId?: string;
}

export async function finalizeUpload(input: FinalizeUploadInput) {
  const userSettings = await prisma.settings.findUnique({
    where: { userId: input.userId },
    select: {
      makeImagesPublic: true,
      customDomain: true,
      disableEmbedByDefault: true,
    },
  });

  const settings = parseSettings(input.rawSettings, {
    makeImagesPublic: userSettings?.makeImagesPublic ?? false,
    disableEmbedByDefault: userSettings?.disableEmbedByDefault ?? false,
  });

  const filename = buildConvertedFilename(input.originalName, settings);

  const sizeLimit = input.isPremium ? FILE_SIZE_LIMITS.PREMIUM : FILE_SIZE_LIMITS.FREE;
  if (input.file.size > sizeLimit) {
    const limitInMb = sizeLimit / (1024 * 1024);
    throw new Error(`File too large. Maximum file size is ${limitInMb}MB for all users`);
  }

  if (!input.isPremium) {
    const totalUsed = await prisma.media.aggregate({
      where: { userId: input.userId },
      _sum: { size: true },
    });

    const currentUsage = Number(totalUsed._sum?.size || 0);
    if (currentUsage + input.file.size > STORAGE_LIMITS.FREE) {
      throw new Error("Storage limit reached. Upgrade to premium for unlimited storage.");
    }
  }

  if (BLOCKED_TYPES.includes(input.file.type)) {
    throw new Error("This file type is not allowed for security reasons.");
  }

  const processedFile = await processFile(input.file, settings);
  const fileId = input.fileId ?? nanoid(6);
  const uploadResult = await uploadFile(processedFile, input.userId, filename, fileId);

  let archiveMetadata = null;
  let archiveType = null;
  let fileCount = null;

  if (ServerArchiveProcessor.supportsPreview(input.originalName)) {
    try {
      const buffer = Buffer.from(await input.file.arrayBuffer());
      archiveMetadata = await ServerArchiveProcessor.processArchive(buffer, input.originalName);
      archiveType = archiveMetadata.archiveType;
      fileCount = archiveMetadata.totalFiles;
    } catch (error) {
      console.warn("Failed to process archive metadata:", error);
    }
  }

  const isArchiveUpload = ArchiveProcessor.isArchive(input.originalName);

  const media = await prisma.media.create({
    data: {
      id: fileId,
      url: uploadResult.url,
      filename: uploadResult.filename,
      size: uploadResult.size,
      width: uploadResult.width,
      height: uploadResult.height,
      duration: uploadResult.duration || null,
      type: (isArchiveUpload ? "ARCHIVE" : uploadResult.type.toUpperCase()) as MediaType,
      userId: input.userId,
      public: Boolean(settings.public),
      disableEmbed: Boolean(settings.disableEmbed),
      domain: input.customDomain || null,
      archiveType,
      fileCount,
      archiveMeta: archiveMetadata ? (archiveMetadata as unknown) : null,
    },
  });

  const displayUrl = media.domain
    ? `https://${media.domain}/${media.id}`
    : userSettings?.customDomain
      ? `https://${userSettings.customDomain}/${media.id}`
      : `${input.baseUrl}/${media.id}`;

  await sendDiscordWebhook({ content: displayUrl });

  return {
    id: media.id,
    url: displayUrl,
    rawUrl: `${input.baseUrl}${media.url}`,
    filename: media.filename,
    size: media.size,
    width: media.width,
    height: media.height,
    duration: media.duration,
    type: media.type,
    public: media.public,
    domain: media.domain,
    createdAt: media.createdAt,
    baseUrl: input.baseUrl,
  };
}
