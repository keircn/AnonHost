import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import {
  uploadToR2,
  generateR2Key,
  checkR2Connection,
  isR2Configured,
} from '@/lib/r2';

async function uploadToLocalStorage(options: {
  file: Buffer;
  key: string;
  request: NextRequest;
}): Promise<string> {
  const uploadPath = path.join(
    process.cwd(),
    'uploads',
    ...options.key.split('/')
  );
  const uploadDir = path.dirname(uploadPath);

  await fs.mkdir(uploadDir, { recursive: true });
  await fs.writeFile(uploadPath, options.file);

  const baseUrl = process.env.NEXTAUTH_URL || options.request.nextUrl.origin;
  return `${baseUrl}/api/upload/storage/${options.key}`;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const fileId = formData.get('fileId') as string;
    const filename = formData.get('filename') as string;
    const type = formData.get('type') as string | undefined;
    const userId = formData.get('userId') as string;

    if (!file || !fileId || !filename || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileExt = path.extname(filename);
    const r2Key = generateR2Key(userId, fileId, fileExt, type);

    let url: string;

    if (isR2Configured()) {
      if (!(await checkR2Connection())) {
        return NextResponse.json(
          { error: 'Storage service unavailable' },
          { status: 503 }
        );
      }

      url = await uploadToR2({
        file: buffer,
        key: r2Key,
        contentType: file.type,
        userId: userId,
      });
    } else {
      url = await uploadToLocalStorage({
        file: buffer,
        key: r2Key,
        request,
      });
    }

    return NextResponse.json({
      url,
      filename,
      size: file.size,
      type: file.type,
    });
  } catch (error) {
    console.error('Storage error:', error);
    return NextResponse.json(
      { error: 'Failed to store file' },
      { status: 500 }
    );
  }
}
