import { promises as fs } from "fs";
import path from "path";
import mime from "mime-types";

export async function ensureUploadDir(dir: string) {
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
  }
}

export async function saveFile(
  buffer: Buffer,
  userId: string,
  filename: string,
  fileId: string,
  type?: "avatar" | "banner",
): Promise<string> {
  const uploadDir = path.join(process.cwd(), "uploads");
  const userDir = path.join(uploadDir, userId);

  const finalDir =
    type === "avatar"
      ? path.join(userDir, "avatars")
      : type === "banner"
        ? path.join(userDir, "banners")
        : userDir;

  await ensureUploadDir(finalDir);

  const fileName = `${fileId}${path.extname(filename)}`;
  const filePath = path.join(finalDir, fileName);

  await fs.writeFile(filePath, buffer);

  return `/uploads/${userId}/${type ? `${type}s/` : ""}${fileName}`;
}

export async function getFile(
  filePath: string,
): Promise<{ buffer: Buffer; contentType: string }> {
  const fullPath = path.join(process.cwd(), filePath);
  const buffer = await fs.readFile(fullPath);
  const contentType = mime.lookup(fullPath) || "application/octet-stream";
  return { buffer, contentType };
}
