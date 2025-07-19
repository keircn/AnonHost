import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import {
  BLOCKED_TYPES,
  uploadFile,
  FILE_SIZE_LIMITS,
  STORAGE_LIMITS,
} from '@/lib/upload';
import { verifyApiKey } from '@/lib/auth';
import { MediaType } from '@prisma/client';
import { sendDiscordWebhook } from '@/lib/discord';
import { processFile } from '@/lib/process-file';
import { ServerArchiveProcessor } from '@/lib/server-archive-processor';
import { FileSettings } from '@/types/file-settings';
import { nanoid } from 'nanoid';
import { 
  getCachedStorageUsage, 
  setCachedStorageUsage, 
  updateCachedStorageUsage 
} from '@/lib/storage-cache';

function isErrorWithCause(error: unknown): error is { cause: unknown } {
  return typeof error === 'object' && error !== null && 'cause' in error;
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const apiKey = req.headers.get('authorization')?.split('Bearer ')[1];
  const baseUrl = process.env.NEXTAUTH_URL;

  if (!session && !apiKey) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let userId: string;
  let isPremium = false;

  if (apiKey) {
    const user = await verifyApiKey(apiKey);
    if (!user) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
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
    const file = formData.get('file') as File | Blob;
    const settingsStr = formData.get('settings') as string | null;
    let settings: FileSettings = {
      conversion: {
        enabled: false,
        format: undefined,
      },
      public: true,
      compression: {
        enabled: false,
        quality: 80,
      },
      resize: {
        enabled: false,
        width: undefined,
        height: undefined,
        maintainAspectRatio: true,
      },
    };
    if (settingsStr) {
      try {
        const parsedSettings = JSON.parse(settingsStr);
        settings = {
          conversion: {
            enabled: parsedSettings?.conversion?.enabled ?? false,
            format: parsedSettings?.conversion?.format ?? null,
          },
          public: parsedSettings?.public ?? true,
          compression: {
            enabled: parsedSettings?.compression?.enabled ?? false,
            quality: parsedSettings?.compression?.quality ?? 80,
          },
          resize: {
            enabled: parsedSettings?.resize?.enabled ?? false,
            width: parsedSettings?.resize?.width ?? undefined,
            height: parsedSettings?.resize?.height ?? undefined,
            maintainAspectRatio:
              parsedSettings?.resize?.maintainAspectRatio ?? true,
          },
        };
      } catch (e) {
        console.warn('Failed to parse settings:', e);
      }
    }
    const customDomain = formData.get('domain') as string | null;
    const fileId = nanoid(6);

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const originalName = (file as File).name || 'untitled';
    const newFormat =
      settings.conversion.enabled && settings.conversion.format
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
          error: `File too large. Maximum file size is ${limitInMb}MB for ${isPremium ? 'premium' : 'free'} users`,
        },
        { status: 400 }
      );
    }

    if (!isPremium) {
      // Try to get storage usage from cache first
      let currentUsage = getCachedStorageUsage(userId);
      
      if (currentUsage === null) {
        // Cache miss - fetch from database
        const totalUsed = await prisma.media.aggregate({
          where: { userId },
          _sum: { size: true },
        });
        currentUsage = Number(totalUsed._sum?.size || 0);
        setCachedStorageUsage(userId, currentUsage);
      }

      if (currentUsage + file.size > STORAGE_LIMITS.FREE) {
        return NextResponse.json(
          {
            error:
              'Storage limit reached. Upgrade to premium for unlimited storage.',
          },
          { status: 400 }
        );
      }
    }

    if (BLOCKED_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          error: 'This file type is not allowed for security reasons.',
        },
        { status: 400 }
      );
    }

    const processedFile = await processFile(file, settings);
    const uploadResult = await uploadFile(
      processedFile,
      userId.toString(),
      newFilename,
      fileId
    );

    let archiveMetadata = null;
    let archiveType = null;
    let fileCount = null;

    if (ServerArchiveProcessor.isArchive(originalName)) {
      try {
        const buffer = Buffer.from(await file.arrayBuffer());
        archiveMetadata = await ServerArchiveProcessor.processArchive(
          buffer,
          originalName
        );
        archiveType = archiveMetadata.archiveType;
        fileCount = archiveMetadata.totalFiles;
      } catch (error) {
        console.warn('Failed to process archive metadata:', error);
      }
    }

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
      archiveType,
      fileCount,
      archiveMeta: archiveMetadata ? (archiveMetadata as any) : null,
    };

    const [media, userSettings] = await Promise.all([
      prisma.media.create({ data: dbData }),
      prisma.settings.findUnique({
        where: { userId },
        select: { customDomain: true },
      }),
    ]);

    // Update the cached storage usage
    updateCachedStorageUsage(userId, uploadResult.size);

    const displayUrl = media.domain
      ? `https://${media.domain}/${media.id}`
      : userSettings?.customDomain
        ? `https://${userSettings.customDomain}/${media.id}`
        : `${baseUrl}/${media.id}`;

    await sendDiscordWebhook({ content: displayUrl });

    return NextResponse.json({
      id: media.id,
      url: displayUrl,
      rawUrl: `${baseUrl}${media.url}`,
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
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
        cause: isErrorWithCause(error) ? error.cause : undefined,
      });
    } else {
      console.error('Unknown error:', error);
    }
    return NextResponse.json(
      { error: 'Failed to upload media' },
      { status: 500 }
    );
  }
}
