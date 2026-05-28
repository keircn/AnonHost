import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { verifyApiKey } from '@/lib/auth';
import { finalizeUpload } from '@/lib/server/upload-finalizer';

const MAX_REMOTE_FILE_SIZE = 500 * 1024 * 1024;
const FETCH_TIMEOUT_MS = 60_000;

function getFilenameFromUrl(urlStr: string): string {
  try {
    const url = new URL(urlStr);
    const pathname = url.pathname.replace(/\/$/, '');
    const segments = pathname.split('/');
    const last = segments[segments.length - 1] || 'untitled';
    return decodeURIComponent(last) || 'untitled';
  } catch {
    return 'untitled';
  }
}

function getFilenameFromHeaders(headers: Headers, fallback: string): string {
  const disposition = headers.get('content-disposition');
  if (disposition) {
    const match = disposition.match(/filename\*?=(?:UTF-8'')?["']?([^;"'\s]+)/i);
    if (match) return decodeURIComponent(match[1]);
  }
  return fallback;
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
    const body = await req.json();
    const remoteUrl = body.url as string | undefined;

    if (!remoteUrl || typeof remoteUrl !== 'string') {
      return NextResponse.json({ error: 'url is required' }, { status: 400 });
    }

    let parsed: URL;
    try {
      parsed = new URL(remoteUrl);
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        throw new Error('Invalid protocol');
      }
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL. Must be a valid http(s) URL.' },
        { status: 400 }
      );
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch(remoteUrl, {
        signal: controller.signal,
        redirect: 'follow',
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      return NextResponse.json(
        { error: `Remote server returned ${response.status}` },
        { status: 502 }
      );
    }

    const contentLength = response.headers.get('content-length');
    if (contentLength) {
      const size = Number.parseInt(contentLength, 10);
      if (!Number.isNaN(size) && size > MAX_REMOTE_FILE_SIZE) {
        return NextResponse.json(
          { error: 'Remote file exceeds maximum size of 500MB' },
          { status: 400 }
        );
      }
    }

    const buffer = Buffer.from(await response.arrayBuffer());

    if (buffer.length > MAX_REMOTE_FILE_SIZE) {
      return NextResponse.json(
        { error: 'Remote file exceeds maximum size of 500MB' },
        { status: 400 }
      );
    }

    const urlFilename = getFilenameFromUrl(remoteUrl);
    const filename = getFilenameFromHeaders(response.headers, urlFilename);
    const contentType =
      response.headers.get('content-type') || 'application/octet-stream';

    const file = new Blob([buffer], { type: contentType });

    let expiresAt: Date | null = null;
    if (body.expiresIn && typeof body.expiresIn === 'number') {
      expiresAt = new Date(Date.now() + body.expiresIn * 1000);
    }

    const result = await finalizeUpload({
      file: file as File,
      originalName: filename,
      userId,
      isPremium,
      baseUrl: baseUrl || req.nextUrl.origin,
      rawSettings: body.settings || null,
      customDomain: body.domain || null,
      fileId: body.fileId || undefined,
      expiresAt,
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error) {
      if (
        error.message.includes('File too large') ||
        error.message.includes('Storage limit reached') ||
        error.message.includes('not allowed')
      ) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      if (error.name === 'AbortError') {
        return NextResponse.json(
          { error: 'Request to remote server timed out' },
          { status: 504 }
        );
      }
    }

    console.error('Upload from URL error:', error);
    return NextResponse.json(
      { error: 'Failed to upload from URL' },
      { status: 500 }
    );
  }
}
