import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { verifyApiKey } from '@/lib/auth';
import { promises as fs } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';

const TEMP_DIR = join(tmpdir(), 'anon-chunks');

async function ensureTempDir() {
  try {
    await fs.access(TEMP_DIR);
  } catch {
    await fs.mkdir(TEMP_DIR, { recursive: true });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const apiKey = req.headers.get('authorization')?.split('Bearer ')[1];

  if (!session && !apiKey) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (apiKey) {
    const user = await verifyApiKey(apiKey);
    if (!user) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
    }
  }

  try {
    await ensureTempDir();

    const formData = await req.formData();
    const chunk = formData.get('chunk') as File;
    const chunkIndex = parseInt(formData.get('chunkIndex') as string);
    const totalChunks = parseInt(formData.get('totalChunks') as string);
    const fileId = formData.get('fileId') as string;
    const fileName = formData.get('fileName') as string;

    if (
      !chunk ||
      isNaN(chunkIndex) ||
      isNaN(totalChunks) ||
      !fileId ||
      !fileName
    ) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const chunkPath = join(TEMP_DIR, `${fileId}_${chunkIndex}`);
    try {
      const chunkBuffer = Buffer.from(await chunk.arrayBuffer());
      await fs.writeFile(chunkPath, chunkBuffer);
    } catch (error) {
      console.error(`Failed to write chunk ${chunkIndex}:`, error);
      throw error;
    }
    const uploadedChunks = [];
    for (let i = 0; i < totalChunks; i++) {
      const chunkFile = join(TEMP_DIR, `${fileId}_${i}`);
      try {
        await fs.access(chunkFile);
        uploadedChunks.push(i);
      } catch {}
    }

    if (uploadedChunks.length === totalChunks) {
      return NextResponse.json({
        message: 'Chunk uploaded',
        allChunksUploaded: true,
        uploadedChunks: uploadedChunks.length,
        totalChunks,
      });
    }

    return NextResponse.json({
      message: 'Chunk uploaded',
      allChunksUploaded: false,
      uploadedChunks: uploadedChunks.length,
      totalChunks,
    });
  } catch (error) {
    console.error('Error uploading chunk:', error);
    return NextResponse.json(
      { error: 'Failed to upload chunk' },
      { status: 500 }
    );
  }
}
