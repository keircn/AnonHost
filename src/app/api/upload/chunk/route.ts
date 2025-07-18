import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { verifyApiKey } from '@/lib/auth';
import { promises as fs } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

export const maxDuration = 600;
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

    // Add timeout wrapper for formData parsing
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), 120000); // 2 min timeout
    });

    const formDataPromise = req.formData();
    const formData = (await Promise.race([
      formDataPromise,
      timeoutPromise,
    ])) as FormData;
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

      // Validate chunk size
      if (chunkBuffer.length === 0) {
        throw new Error('Empty chunk received');
      }

      await fs.writeFile(chunkPath, chunkBuffer);

      // Verify chunk was written correctly
      const stat = await fs.stat(chunkPath);
      if (stat.size !== chunkBuffer.length) {
        throw new Error('Chunk size mismatch after write');
      }
    } catch (error) {
      console.error(`Failed to write chunk ${chunkIndex}:`, error);

      // Cleanup failed chunk
      try {
        await fs.unlink(chunkPath);
      } catch {}

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
