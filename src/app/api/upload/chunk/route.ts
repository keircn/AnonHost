import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { verifyApiKey } from '@/lib/auth';
import { promises as fs } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

export const maxDuration = 300; // Increased from 600 to 300 for more responsive handling
export const dynamic = 'force-dynamic';

const TEMP_DIR = join(tmpdir(), 'anon-chunks');

// Simple in-memory rate limiting for chunk uploads
const uploadRateLimit = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_UPLOADS_PER_MINUTE = 100; // Max 100 chunk uploads per minute per user

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const userLimit = uploadRateLimit.get(userId);
  
  if (!userLimit || now > userLimit.resetTime) {
    uploadRateLimit.set(userId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }
  
  if (userLimit.count >= MAX_UPLOADS_PER_MINUTE) {
    return false;
  }
  
  userLimit.count++;
  return true;
}

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

  let userId: string;
  if (apiKey) {
    const user = await verifyApiKey(apiKey);
    if (!user) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
    }
    userId = user.id.toString();
  } else {
    userId = session!.user.id.toString();
  }

  // Check rate limit
  if (!checkRateLimit(userId)) {
    return NextResponse.json(
      { 
        error: 'Rate limit exceeded - please slow down uploads',
        retryable: true,
        retryAfter: 60 
      },
      { 
        status: 429,
        headers: {
          'Retry-After': '60'
        }
      }
    );
  }

  try {
    await ensureTempDir();

    // Add timeout wrapper for formData parsing with shorter timeout
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), 60000); // Reduced from 2 min to 1 min
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
    
    // Provide more specific error information
    let errorMessage = 'Failed to upload chunk';
    let statusCode = 500;
    
    if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        errorMessage = 'Request timeout - please try again';
        statusCode = 408;
      } else if (error.message.includes('ENOSPC')) {
        errorMessage = 'Server storage full';
        statusCode = 507;
      } else if (error.message.includes('EMFILE') || error.message.includes('ENFILE')) {
        errorMessage = 'Server temporarily busy - please retry';
        statusCode = 503;
      } else if (error.message.includes('Missing required parameters')) {
        errorMessage = 'Invalid request parameters';
        statusCode = 400;
      }
    }
    
    return NextResponse.json(
      { error: errorMessage, retryable: statusCode >= 500 || statusCode === 408 },
      { status: statusCode }
    );
  }
}
