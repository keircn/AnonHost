import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { verifyApiKey } from '@/lib/auth';
import { promises as fs } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import prisma from '@/lib/prisma';
import {
  BLOCKED_TYPES,
  uploadFile,
  FILE_SIZE_LIMITS,
  STORAGE_LIMITS,
} from '@/lib/upload';
import { MediaType } from '@prisma/client';
import { sendDiscordWebhook } from '@/lib/discord';
import { processFile } from '@/lib/process-file';
import { ServerArchiveProcessor } from '@/lib/server-archive-processor';
import { FileSettings } from '@/types/file-settings';

export const maxDuration = 600;
export const dynamic = 'force-dynamic';

const TEMP_DIR = join(tmpdir(), 'anon-chunks');

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
    const {
      fileId,
      fileName,
      totalChunks,
      totalSize,
      settings: settingsStr,
      customDomain,
    } = await req.json();

    if (!fileId || !fileName || !totalChunks || !totalSize) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

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

    const sizeLimit = isPremium
      ? FILE_SIZE_LIMITS.PREMIUM
      : FILE_SIZE_LIMITS.FREE;

    if (totalSize > sizeLimit) {
      const limitInMb = sizeLimit / (1024 * 1024);
      return NextResponse.json(
        {
          error: `File too large. Maximum file size is ${limitInMb}MB for ${isPremium ? 'premium' : 'free'} users`,
        },
        { status: 400 }
      );
    }

    if (!isPremium) {
      const totalUsed = await prisma.media.aggregate({
        where: { userId },
        _sum: { size: true },
      });
      const currentUsage = Number(totalUsed._sum?.size || 0);

      if (currentUsage + totalSize > STORAGE_LIMITS.FREE) {
        return NextResponse.json(
          {
            error:
              'Storage limit reached. Upgrade to premium for unlimited storage.',
          },
          { status: 400 }
        );
      }
    }

    const chunks = await Promise.all(
      Array.from({ length: totalChunks }, async (_, i) => {
        const chunkPath = join(TEMP_DIR, `${fileId}_${i}`);
        try {
          return await fs.readFile(chunkPath);
        } catch (error) {
          console.error(`Failed to read chunk ${i}:`, error);
          throw new Error(`Missing chunk ${i}`);
        }
      })
    );

    const fileBuffer = Buffer.concat(chunks);
    const mimeType = await getMimeType(fileName);

    if (BLOCKED_TYPES.includes(mimeType)) {
      for (let i = 0; i < totalChunks; i++) {
        const chunkPath = join(TEMP_DIR, `${fileId}_${i}`);
        try {
          await fs.unlink(chunkPath);
        } catch (e) {
          console.warn(`Failed to delete chunk ${chunkPath}:`, e);
        }
      }
      return NextResponse.json(
        {
          error: 'This file type is not allowed for security reasons.',
        },
        { status: 400 }
      );
    }

    const file = new File([fileBuffer], fileName, { type: mimeType });
    const originalName = fileName;
    const newFormat =
      settings.conversion.enabled && settings.conversion.format
        ? settings.conversion.format
        : originalName.split('.').pop();
    const newFilename = `${originalName.split('.')[0]}.${newFormat}`;

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
        archiveMetadata = await ServerArchiveProcessor.processArchive(
          fileBuffer,
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

    const displayUrl = media.domain
      ? `https://${media.domain}/${media.id}`
      : userSettings?.customDomain
        ? `https://${userSettings.customDomain}/${media.id}`
        : `${baseUrl}/${media.id}`;

    await sendDiscordWebhook({ content: displayUrl });

    for (let i = 0; i < totalChunks; i++) {
      const chunkPath = join(TEMP_DIR, `${fileId}_${i}`);
      try {
        await fs.unlink(chunkPath);
      } catch (e) {
        console.warn(`Failed to delete chunk ${chunkPath}:`, e);
      }
    }

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
    console.error('Error reassembling file:', error);
    return NextResponse.json(
      { error: 'Failed to reassemble file' },
      { status: 500 }
    );
  }
}

async function getMimeType(fileName: string): Promise<string> {
  const ext = fileName.split('.').pop()?.toLowerCase();
  const mimeTypes: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    mp4: 'video/mp4',
    webm: 'video/webm',
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    pdf: 'application/pdf',
    txt: 'text/plain',
    json: 'application/json',
    zip: 'application/zip',
    rar: 'application/x-rar-compressed',
    '7z': 'application/x-7z-compressed',
  };
  return mimeTypes[ext || ''] || 'application/octet-stream';
}
