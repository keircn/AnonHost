import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

const TEMP_DIR = join(tmpdir(), 'anon-chunks');
const ASSEMBLED_DIR = join(tmpdir(), 'anon-assembled');
const WORKER_PATH = process.env.CHUNK_WORKER_BIN || '/app/bin/chunkworker';

interface WorkerWriteResult {
  uploadedChunks: number;
  allChunksUploaded: boolean;
}

interface WorkerAssembleResult {
  outputPath: string;
  size: number;
}

async function ensureDirs() {
  await fs.mkdir(TEMP_DIR, { recursive: true });
  await fs.mkdir(ASSEMBLED_DIR, { recursive: true });
}

function runWorker(
  args: string[],
  stdinBuffer?: Buffer
): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(WORKER_PATH, args, {
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('error', reject);

    child.on('close', (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
        return;
      }
      reject(
        new Error(
          `chunkworker failed (${code}): ${stderr.trim() || 'unknown error'}`
        )
      );
    });

    if (stdinBuffer) {
      child.stdin.write(stdinBuffer);
    }
    child.stdin.end();
  });
}

export async function writeChunkWithWorker(params: {
  fileId: string;
  chunkIndex: number;
  totalChunks: number;
  chunkBuffer: Buffer;
}): Promise<WorkerWriteResult> {
  await ensureDirs();

  const { stdout } = await runWorker(
    [
      'write',
      '--dir',
      TEMP_DIR,
      '--file-id',
      params.fileId,
      '--chunk-index',
      String(params.chunkIndex),
      '--total-chunks',
      String(params.totalChunks),
    ],
    params.chunkBuffer
  );

  return JSON.parse(stdout) as WorkerWriteResult;
}

export async function assembleFileWithWorker(params: {
  fileId: string;
  totalChunks: number;
  fileName: string;
}): Promise<WorkerAssembleResult> {
  await ensureDirs();

  const outputPath = join(ASSEMBLED_DIR, `${params.fileId}-${params.fileName}`);
  const { stdout } = await runWorker([
    'assemble',
    '--dir',
    TEMP_DIR,
    '--file-id',
    params.fileId,
    '--total-chunks',
    String(params.totalChunks),
    '--output',
    outputPath,
  ]);

  return JSON.parse(stdout) as WorkerAssembleResult;
}

export async function cleanupChunksWithWorker(params: {
  fileId: string;
  totalChunks: number;
}) {
  try {
    await runWorker([
      'cleanup',
      '--dir',
      TEMP_DIR,
      '--file-id',
      params.fileId,
      '--total-chunks',
      String(params.totalChunks),
    ]);
  } catch (error) {
    console.warn('Failed to cleanup chunks with worker:', error);
  }
}

export async function cleanupAssembledFile(filePath: string) {
  try {
    await fs.unlink(filePath);
  } catch (error) {
    console.warn('Failed to cleanup assembled file:', error);
  }
}
