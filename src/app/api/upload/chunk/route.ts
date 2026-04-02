import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { verifyApiKey } from '@/lib/auth';
import { writeChunkWithWorker } from '@/lib/server/chunk-worker';

export const maxDuration = 600;
export const dynamic = 'force-dynamic';

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
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), 120000);
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

    const chunkBuffer = Buffer.from(await chunk.arrayBuffer());
    if (chunkBuffer.length === 0) {
      return NextResponse.json(
        { error: 'Empty chunk received' },
        { status: 400 }
      );
    }

    const result = await writeChunkWithWorker({
      fileId,
      chunkIndex,
      totalChunks,
      chunkBuffer,
    });

    return NextResponse.json({
      message: 'Chunk uploaded',
      allChunksUploaded: result.allChunksUploaded,
      uploadedChunks: result.uploadedChunks,
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
