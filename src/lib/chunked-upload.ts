// Optimized upload utilities for better performance
import { CHUNK_SIZE } from './upload';

export interface ChunkedUploadOptions {
  file: File;
  onProgress?: (progress: number) => void;
  onChunkComplete?: (chunkIndex: number, totalChunks: number) => void;
  maxConcurrentChunks?: number;
  maxRetries?: number;
  timeoutMs?: number;
  retryDelayMs?: number;
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
  maxConcurrentChunks = 2, // Reduced for better reliability on weak connections
  maxRetries = 3,
  timeoutMs = 60000, // 60 second timeout per chunk
  retryDelayMs = 1000,
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
        await uploadChunkWithRetry(chunk, fileId, chunkIndex, totalChunks, maxRetries, timeoutMs, retryDelayMs);
        
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

async function uploadChunkWithRetry(
  chunk: File,
  fileId: string,
  chunkIndex: number,
  totalChunks: number,
  maxRetries: number,
  timeoutMs: number,
  retryDelayMs: number
): Promise<void> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      await uploadChunk(chunk, fileId, chunkIndex, totalChunks, timeoutMs);
      return; // Success
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt === maxRetries) {
        throw new Error(`Failed to upload chunk ${chunkIndex} after ${maxRetries + 1} attempts: ${lastError.message}`);
      }
      
      // Exponential backoff with jitter
      const delay = retryDelayMs * Math.pow(2, attempt) + Math.random() * 1000;
      console.warn(`Chunk ${chunkIndex} upload attempt ${attempt + 1} failed, retrying in ${Math.round(delay)}ms:`, lastError.message);
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

async function uploadChunk(
  chunk: File,
  fileId: string,
  chunkIndex: number,
  totalChunks: number,
  timeoutMs?: number
): Promise<void> {
  const formData = new FormData();
  formData.append('chunk', chunk);
  formData.append('fileId', fileId);
  formData.append('chunkIndex', chunkIndex.toString());
  formData.append('totalChunks', totalChunks.toString());

  const controller = new AbortController();
  const timeoutId = timeoutMs ? setTimeout(() => controller.abort(), timeoutMs) : null;

  try {
    const response = await fetch('/api/upload/chunk', {
      method: 'POST',
      body: formData,
      signal: controller.signal,
      // Add keep-alive and connection management headers
      headers: {
        'Connection': 'keep-alive',
      },
    });

    if (timeoutId) clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
    }
  } catch (error) {
    if (timeoutId) clearTimeout(timeoutId);
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error(`Chunk upload timeout after ${timeoutMs}ms`);
      }
      throw error;
    }
    throw new Error('Unknown error occurred during chunk upload');
  }
}

async function reassembleFile(fileId: string, totalChunks: number): Promise<void> {
  const maxRetries = 3;
  const retryDelayMs = 2000;
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minute timeout

      const response = await fetch('/api/upload/reassemble', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Connection': 'keep-alive',
        },
        body: JSON.stringify({
          fileId,
          totalChunks,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
      }
      
      return; // Success
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt === maxRetries) {
        throw new Error(`Failed to reassemble file after ${maxRetries + 1} attempts: ${lastError.message}`);
      }
      
      const delay = retryDelayMs * Math.pow(2, attempt);
      console.warn(`Reassemble attempt ${attempt + 1} failed, retrying in ${delay}ms:`, lastError.message);
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

async function uploadSingleFile(file: File): Promise<ChunkedUploadResult> {
  // For small files, use the regular upload endpoint with retry logic
  const fileId = generateFileId();
  const maxRetries = 3;
  const retryDelayMs = 1000;
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fileId', fileId);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minute timeout

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        signal: controller.signal,
        headers: {
          'Connection': 'keep-alive',
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
      }

      return {
        fileId,
        totalChunks: 1,
        totalSize: file.size,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt === maxRetries) {
        throw new Error(`Failed to upload file after ${maxRetries + 1} attempts: ${lastError.message}`);
      }
      
      const delay = retryDelayMs * Math.pow(2, attempt);
      console.warn(`Upload attempt ${attempt + 1} failed, retrying in ${delay}ms:`, lastError.message);
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  // This should never be reached due to the throw in the loop
  throw lastError || new Error('Upload failed for unknown reason');
}

function generateFileId(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}