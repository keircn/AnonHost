import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { uploadToR2, generateR2Key, checkR2Connection } from '@/lib/r2';

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

    if (!(await checkR2Connection())) {
      return NextResponse.json(
        { error: 'Storage service unavailable' },
        { status: 503 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileExt = path.extname(filename);
    const r2Key = generateR2Key(userId, fileId, fileExt, type);
    const url = await uploadToR2({
      file: buffer,
      key: r2Key,
      contentType: file.type,
      userId: userId,
    });

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
