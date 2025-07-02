import path from "path";
import { promises as fs } from "fs";
import mime from "mime-types";
import { uploadToR2, generateR2Key } from "@/lib/r2";

export async function saveFile(
  buffer: Buffer,
  userId: string,
  filename: string,
  fileId: string,
  type?: "avatar" | "banner"
): Promise<string> {
  const fileExt = path.extname(filename);
  const r2Key = generateR2Key(userId, fileId, fileExt, type);

  let contentType = "application/octet-stream";
  const ext = fileExt.toLowerCase();
  if (ext === ".jpg" || ext === ".jpeg") contentType = "image/jpeg";
  else if (ext === ".png") contentType = "image/png";
  else if (ext === ".gif") contentType = "image/gif";
  else if (ext === ".webp") contentType = "image/webp";
  else if (ext === ".svg") contentType = "image/svg+xml";

  const url = await uploadToR2({
    file: buffer,
    key: r2Key,
    contentType,
    userId,
  });

  return url;
}

export async function getFile(
  filePath: string
): Promise<{ buffer: Buffer; contentType: string }> {
  const fullPath = path.join(process.cwd(), filePath);
  const buffer = await fs.readFile(fullPath);
  const contentType = mime.lookup(fullPath) || "application/octet-stream";
  return { buffer, contentType };
}
