import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

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

    const uploadDir = path.join(process.cwd(), "uploads");
    const userDir = path.join(uploadDir, userId);
    const finalDir = type ? path.join(userDir, `${type}s`) : userDir;

    if (!(await checkDiskSpace(uploadDir, file.size))) {
      return NextResponse.json(
        { error: "Insufficient disk space" },
        { status: 507 },
      );
    }

    await ensureUploadDir(finalDir);

    const fileExt = path.extname(filename);
    const filePath = path.join(finalDir, `${fileId}${fileExt}`);

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
