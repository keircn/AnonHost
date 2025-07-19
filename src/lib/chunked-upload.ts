// Optimized upload utilities for better performance
import { CHUNK_SIZE } from './upload';

export interface ChunkedUploadOptions {
  file: File;
  onProgress?: (progress: number) => void;
  onChunkComplete?: (chunkIndex: number, totalChunks: number) => void;
  maxConcurrentChunks?: number;
}

export interface ChunkedUploadResult {
  fileId: string;
  totalChunks: number;
  totalSize: number;
}

/**
 * Upload a large file in chunks to improve performance and reliability
 */
export async function uploadFileInChunks({
  file,
  onProgress,
  onChunkComplete,
  maxConcurrentChunks = 3,
}: ChunkedUploadOptions): Promise<ChunkedUploadResult> {
  const totalSize = file.size;
  const totalChunks = Math.ceil(totalSize / CHUNK_SIZE);
  
  if (totalChunks === 1) {
    // Small file, upload directly
    return uploadSingleFile(file);
  }

  const fileId = generateFileId();
  const chunks: Promise<void>[] = [];
  let uploadedBytes = 0;

  // Create semaphore to limit concurrent uploads
  const semaphore = new Semaphore(maxConcurrentChunks);

  for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
    const chunk = createFileChunk(file, chunkIndex, CHUNK_SIZE);
    
    const uploadPromise = semaphore.acquire().then(async (release) => {
      try {
        await uploadChunk(chunk, fileId, chunkIndex, totalChunks);
        
        uploadedBytes += chunk.size;
        const progress = (uploadedBytes / totalSize) * 100;
        
        onProgress?.(progress);
        onChunkComplete?.(chunkIndex, totalChunks);
      } finally {
        release();
      }
    });

    chunks.push(uploadPromise);
  }

  await Promise.all(chunks);

  // Reassemble the file on the server
  await reassembleFile(fileId, totalChunks);

  return {
    fileId,
    totalChunks,
    totalSize,
  };
}

/**
 * Simple semaphore implementation for controlling concurrency
 */
class Semaphore {
  private permits: number;
  private waiting: Array<() => void> = [];

  constructor(permits: number) {
    this.permits = permits;
  }

  async acquire(): Promise<() => void> {
    return new Promise((resolve) => {
      if (this.permits > 0) {
        this.permits--;
        resolve(() => this.release());
      } else {
        this.waiting.push(() => {
          this.permits--;
          resolve(() => this.release());
        });
      }
    });
  }

  private release(): void {
    this.permits++;
    const next = this.waiting.shift();
    if (next) {
      next();
    }
  }
}

function createFileChunk(file: File, chunkIndex: number, chunkSize: number): File {
  const start = chunkIndex * chunkSize;
  const end = Math.min(start + chunkSize, file.size);
  const chunk = file.slice(start, end);
  
  return new File([chunk], `${file.name}.chunk.${chunkIndex}`, {
    type: file.type,
  });
}

async function uploadChunk(
  chunk: File,
  fileId: string,
  chunkIndex: number,
  totalChunks: number
): Promise<void> {
  const formData = new FormData();
  formData.append('chunk', chunk);
  formData.append('fileId', fileId);
  formData.append('chunkIndex', chunkIndex.toString());
  formData.append('totalChunks', totalChunks.toString());

  const response = await fetch('/api/upload/chunk', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Failed to upload chunk ${chunkIndex}: ${response.statusText}`);
  }
}

async function reassembleFile(fileId: string, totalChunks: number): Promise<void> {
  const response = await fetch('/api/upload/reassemble', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      fileId,
      totalChunks,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to reassemble file: ${response.statusText}`);
  }
}

async function uploadSingleFile(file: File): Promise<ChunkedUploadResult> {
  // For small files, use the regular upload endpoint
  const fileId = generateFileId();
  
  const formData = new FormData();
  formData.append('file', file);
  formData.append('fileId', fileId);

  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Failed to upload file: ${response.statusText}`);
  }

  return {
    fileId,
    totalChunks: 1,
    totalSize: file.size,
  };
}

function generateFileId(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}