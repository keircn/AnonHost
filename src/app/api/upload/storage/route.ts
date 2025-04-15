import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

type AllowedMimeTypes = keyof typeof FILE_SIGNATURES;

const FILE_SIGNATURES = {
  "image/jpeg": [[0xff, 0xd8, 0xff]],
  "image/png": [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]],
  "image/gif": [
    [0x47, 0x49, 0x46, 0x38, 0x37, 0x61],
    [0x47, 0x49, 0x46, 0x38, 0x39, 0x61],
  ],
  "image/webp": [[0x52, 0x49, 0x46, 0x46]],
  "video/mp4": [[0x66, 0x74, 0x79, 0x70]],
  "video/webm": [[0x1a, 0x45, 0xdf, 0xa3]],
  "audio/mpeg": [
    [0x49, 0x44, 0x33],
    [0xff, 0xfb],
  ],
};

async function validateFileSignature(
  file: File | Blob,
  expectedType: AllowedMimeTypes,
): Promise<boolean> {
  const buffer = await file.slice(0, 8).arrayBuffer();
  const bytes = new Uint8Array(buffer);

  const signatures = FILE_SIGNATURES[expectedType];
  if (!signatures) return true;

  return signatures.some((signature) =>
    signature.every((byte, i) => bytes[i] === byte),
  );
}

async function checkDiskSpace(
  uploadDir: string,
  fileSize: number,
): Promise<boolean> {
  try {
    const stats = await fs.statfs(uploadDir);
    const freeSpace = stats.bfree * stats.bsize;
    return freeSpace > fileSize * 2;
  } catch (error) {
    console.error("Error checking disk space:", error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const fileId = formData.get("fileId") as string;
    const filename = formData.get("filename") as string;
    const type = formData.get("type") as string | undefined;
    const userId = formData.get("userId") as string;

    if (!file || !fileId || !filename || !userId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    if (
      !Object.keys(FILE_SIGNATURES).includes(file.type) ||
      !(await validateFileSignature(file, file.type as AllowedMimeTypes))
    ) {
      return NextResponse.json(
        { error: "Invalid file format" },
        { status: 400 },
      );
    }

    const uploadDir = path.join(process.cwd(), "uploads");
    const userDir = path.join(uploadDir, userId);
    const finalDir = type ? path.join(userDir, `${type}s`) : userDir;

    // Check disk space
    if (!(await checkDiskSpace(uploadDir, file.size))) {
      return NextResponse.json(
        { error: "Insufficient disk space" },
        { status: 507 },
      );
    }

    await ensureUploadDir(finalDir);

    const fileExt = path.extname(filename);
    const filePath = path.join(finalDir, `${fileId}${fileExt}`);

    // Stream the file instead of loading it all into memory
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(filePath, buffer, { mode: 0o644 }); // Secure file permissions

    const url = `/uploads/${userId}${type ? `/${type}s` : ""}/${fileId}${fileExt}`;

    return NextResponse.json({
      url,
      filename,
      size: file.size,
      type: file.type,
    });
  } catch (error) {
    console.error("Storage error:", error);
    return NextResponse.json(
      { error: "Failed to store file" },
      { status: 500 },
    );
  }
}

async function ensureUploadDir(dir: string) {
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true, mode: 0o755 });
  }
}
