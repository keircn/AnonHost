import { NextRequest, NextResponse } from 'next/server';
import { getFile } from '@/lib/server/storage';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await params;
    const filePath = `uploads/${path.join('/')}`;
    const { buffer, contentType } = await getFile(filePath);

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000',
      },
    });
  } catch (error) {
    console.error('Error serving file:', error);
    return new NextResponse('File not found', { status: 404 });
  }
}
