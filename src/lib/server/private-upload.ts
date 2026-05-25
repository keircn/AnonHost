import path from 'path';
import { promises as fs } from 'fs';
import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'crypto';
import { promisify } from 'util';
import { and, eq, isNull, sql } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { db } from '@/lib/db';
import { privateUploads } from '@/lib/db/schema';
import { BLOCKED_TYPES, FILE_SIZE_LIMITS, STORAGE_LIMITS } from '@/lib/upload';
import {
  checkR2Connection,
  deleteFromR2Key,
  getR2Client,
  isR2Configured,
  readFromR2Key,
} from '@/lib/r2';
import { PutObjectCommand } from '@aws-sdk/client-s3';

const scrypt = promisify(scryptCallback);
const PASSWORD_KEY_LENGTH = 64;

export interface PrivateUploadResponse {
  id: string;
  webUrl: string;
  terminalUrl: string;
  curlCommand: string;
  filename: string;
  size: number;
  oneUse: boolean;
}

export interface PrivateDownloadPayload {
  buffer: Buffer;
  filename: string;
  contentType: string;
  size: number;
}

export interface PrivateUploadListItem {
  id: string;
  filename: string;
  size: number;
  contentType: string;
  oneUse: boolean;
  createdAt: Date;
  webUrl: string;
  terminalUrl: string;
  curlCommand: string;
}

function sanitizeFilename(filename: string): string {
  return (
    path
      .basename(filename)
      .replace(/[\r\n"]/g, '')
      .slice(0, 255) || 'private-upload'
  );
}

function getFileExtension(filename: string): string {
  return path
    .extname(filename)
    .replace(/[^a-zA-Z0-9.]/g, '')
    .toLowerCase();
}

function getLocalPath(objectKey: string): string {
  return path.join(process.cwd(), 'uploads', ...objectKey.split('/'));
}

function assertSafeLocalPath(filePath: string) {
  const uploadsRoot = path.join(process.cwd(), 'uploads');
  const normalized = path.normalize(filePath);
  if (!normalized.startsWith(uploadsRoot)) {
    throw new Error('Unsafe storage path');
  }
}

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString('base64url');
  const hash = (await scrypt(password, salt, PASSWORD_KEY_LENGTH)) as Buffer;
  return {
    salt,
    hash: hash.toString('base64url'),
  };
}

async function verifyPassword(
  password: string,
  salt: string,
  expectedHash: string
) {
  const hash = (await scrypt(password, salt, PASSWORD_KEY_LENGTH)) as Buffer;
  const expected = Buffer.from(expectedHash, 'base64url');

  if (hash.length !== expected.length) {
    return false;
  }

  return timingSafeEqual(hash, expected);
}

async function savePrivateBuffer(
  buffer: Buffer,
  objectKey: string,
  contentType: string,
  userId: string
) {
  if (isR2Configured() && (await checkR2Connection())) {
    await getR2Client().send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME!,
        Key: objectKey,
        Body: buffer,
        ContentType: contentType,
        Metadata: {
          userId,
          private: 'true',
          uploadedAt: new Date().toISOString(),
        },
      })
    );
    return;
  }

  const localPath = getLocalPath(objectKey);
  assertSafeLocalPath(localPath);
  await fs.mkdir(path.dirname(localPath), { recursive: true });
  await fs.writeFile(localPath, buffer);
}

async function readPrivateBuffer(objectKey: string) {
  if (isR2Configured() && (await checkR2Connection())) {
    return readFromR2Key(objectKey);
  }

  const localPath = getLocalPath(objectKey);
  assertSafeLocalPath(localPath);
  return fs.readFile(localPath);
}

async function deletePrivateObject(objectKey: string) {
  if (isR2Configured() && (await checkR2Connection())) {
    await deleteFromR2Key(objectKey);
    return;
  }

  const localPath = getLocalPath(objectKey);
  assertSafeLocalPath(localPath);
  await fs.rm(localPath, { force: true });
}

function buildDownloadResponse(payload: PrivateDownloadPayload) {
  return {
    headers: {
      'Content-Type': payload.contentType,
      'Content-Length': String(payload.size),
      'Content-Disposition': `attachment; filename="${sanitizeFilename(payload.filename)}"`,
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
    body: new Uint8Array(payload.buffer),
  };
}

export async function createPrivateUpload(input: {
  file: File | Blob;
  originalName: string;
  password: string;
  oneUse: boolean;
  userId: string;
  isPremium: boolean;
  baseUrl: string;
}): Promise<PrivateUploadResponse> {
  const filename = sanitizeFilename(input.originalName);
  const contentType = input.file.type || 'application/octet-stream';
  const password = input.password.trim();

  if (!password) {
    throw new Error('Password is required');
  }

  if (password.length < 8) {
    throw new Error('Password must be at least 8 characters');
  }

  const sizeLimit = input.isPremium
    ? FILE_SIZE_LIMITS.PREMIUM
    : FILE_SIZE_LIMITS.FREE;
  if (input.file.size > sizeLimit) {
    throw new Error(
      `File too large. Maximum file size is ${sizeLimit / (1024 * 1024)}MB`
    );
  }

  if (!input.isPremium) {
    const [usage] = await db
      .select({
        total: sql<number>`coalesce(sum(${privateUploads.size}), 0)::int`,
      })
      .from(privateUploads)
      .where(eq(privateUploads.userId, input.userId));
    const currentPrivateUsage = Number(usage?.total || 0);
    if (currentPrivateUsage + input.file.size > STORAGE_LIMITS.FREE) {
      throw new Error(
        'Storage limit reached. Upgrade to premium for unlimited storage.'
      );
    }
  }

  if (BLOCKED_TYPES.includes(contentType)) {
    throw new Error('This file type is not allowed for security reasons.');
  }

  const id = nanoid(12);
  const downloadToken = nanoid(40);
  const objectKey = `${input.userId}/private/${id}${getFileExtension(filename)}`;
  const buffer = Buffer.from(await input.file.arrayBuffer());
  const { salt, hash } = await hashPassword(password);

  await savePrivateBuffer(buffer, objectKey, contentType, input.userId);

  try {
    await db.insert(privateUploads).values({
      id,
      downloadToken,
      objectKey,
      filename,
      size: input.file.size,
      contentType,
      passwordHash: hash,
      passwordSalt: salt,
      oneUse: input.oneUse,
      userId: input.userId,
    });
  } catch (error) {
    await deletePrivateObject(objectKey).catch(() => undefined);
    throw error;
  }

  const baseUrl = input.baseUrl.replace(/\/$/, '');
  const webUrl = `${baseUrl}/private/${id}`;
  const terminalUrl = `${baseUrl}/api/private-upload/token/${downloadToken}`;

  return {
    id,
    webUrl,
    terminalUrl,
    curlCommand: `curl -fL -OJ ${terminalUrl}`,
    filename,
    size: input.file.size,
    oneUse: input.oneUse,
  };
}

export async function createPrivateUploadRecord(input: {
  id?: string;
  objectKey: string;
  filename: string;
  size: number;
  contentType: string;
  password: string;
  oneUse: boolean;
  userId: string;
  baseUrl: string;
}): Promise<PrivateUploadResponse> {
  const password = input.password.trim();

  if (!password) {
    throw new Error('Password is required');
  }

  if (password.length < 8) {
    throw new Error('Password must be at least 8 characters');
  }

  const id = input.id ?? nanoid(12);
  const downloadToken = nanoid(40);
  const { salt, hash } = await hashPassword(password);

  await db.insert(privateUploads).values({
    id,
    downloadToken,
    objectKey: input.objectKey,
    filename: sanitizeFilename(input.filename),
    size: input.size,
    contentType: input.contentType || 'application/octet-stream',
    passwordHash: hash,
    passwordSalt: salt,
    oneUse: input.oneUse,
    userId: input.userId,
  });

  const baseUrl = input.baseUrl.replace(/\/$/, '');
  const webUrl = `${baseUrl}/private/${id}`;
  const terminalUrl = `${baseUrl}/api/private-upload/token/${downloadToken}`;

  return {
    id,
    webUrl,
    terminalUrl,
    curlCommand: `curl -fL -OJ ${terminalUrl}`,
    filename: sanitizeFilename(input.filename),
    size: input.size,
    oneUse: input.oneUse,
  };
}

export async function getPrivateUploadPublicInfo(id: string) {
  const [row] = await db
    .select({
      id: privateUploads.id,
      filename: privateUploads.filename,
      size: privateUploads.size,
      oneUse: privateUploads.oneUse,
      consumedAt: privateUploads.consumedAt,
      createdAt: privateUploads.createdAt,
    })
    .from(privateUploads)
    .where(eq(privateUploads.id, id))
    .limit(1);

  return row ?? null;
}

export async function downloadPrivateUploadWithPassword(input: {
  id: string;
  password: string;
}): Promise<PrivateDownloadPayload> {
  const [row] = await db
    .select()
    .from(privateUploads)
    .where(
      and(eq(privateUploads.id, input.id), isNull(privateUploads.consumedAt))
    )
    .limit(1);

  if (!row) {
    throw new Error('Private upload not found');
  }

  if (
    !(await verifyPassword(input.password, row.passwordSalt, row.passwordHash))
  ) {
    throw new Error('Invalid password');
  }

  const buffer = await readPrivateBuffer(row.objectKey);

  if (row.oneUse) {
    await consumePrivateUpload(row.id, row.objectKey);
  }

  return {
    buffer,
    filename: row.filename,
    contentType: row.contentType,
    size: row.size,
  };
}

export async function downloadPrivateUploadWithToken(
  token: string
): Promise<PrivateDownloadPayload> {
  const nextDownloadToken = nanoid(40);
  const [row] = await db
    .update(privateUploads)
    .set({
      downloadToken: nextDownloadToken,
      downloadTokenUsedAt: new Date(),
    })
    .where(
      and(
        eq(privateUploads.downloadToken, token),
        isNull(privateUploads.consumedAt)
      )
    )
    .returning();

  if (!row) {
    throw new Error('Private download link not found or already used');
  }

  const buffer = await readPrivateBuffer(row.objectKey);

  if (row.oneUse) {
    await consumePrivateUpload(row.id, row.objectKey);
  }

  return {
    buffer,
    filename: row.filename,
    contentType: row.contentType,
    size: row.size,
  };
}

async function consumePrivateUpload(id: string, objectKey: string) {
  await db
    .update(privateUploads)
    .set({ consumedAt: new Date() })
    .where(and(eq(privateUploads.id, id), isNull(privateUploads.consumedAt)));
  await deletePrivateObject(objectKey);
}

export async function listPrivateUploadsForUser(
  userId: string,
  baseUrl: string
) {
  const normalizedBaseUrl = baseUrl.replace(/\/$/, '');
  const rows = await db
    .select({
      id: privateUploads.id,
      filename: privateUploads.filename,
      size: privateUploads.size,
      contentType: privateUploads.contentType,
      oneUse: privateUploads.oneUse,
      downloadToken: privateUploads.downloadToken,
      createdAt: privateUploads.createdAt,
    })
    .from(privateUploads)
    .where(
      and(eq(privateUploads.userId, userId), isNull(privateUploads.consumedAt))
    );

  return rows.map((row): PrivateUploadListItem => {
    const webUrl = `${normalizedBaseUrl}/private/${row.id}`;
    const terminalUrl = `${normalizedBaseUrl}/api/private-upload/token/${row.downloadToken}`;

    return {
      id: row.id,
      filename: row.filename,
      size: row.size,
      contentType: row.contentType,
      oneUse: row.oneUse,
      createdAt: row.createdAt,
      webUrl,
      terminalUrl,
      curlCommand: `curl -fL -OJ ${terminalUrl}`,
    };
  });
}

export async function deletePrivateUploadForUser(userId: string, id: string) {
  const [row] = await db
    .delete(privateUploads)
    .where(and(eq(privateUploads.id, id), eq(privateUploads.userId, userId)))
    .returning({
      objectKey: privateUploads.objectKey,
    });

  if (!row) {
    throw new Error('Private upload not found');
  }

  await deletePrivateObject(row.objectKey);
}

export { buildDownloadResponse };
