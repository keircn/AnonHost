import path from "path";
import { promises as fs } from "fs";
import { uploadToR2, generateR2Key, checkR2Connection, isR2Configured } from "@/lib/r2";

export async function saveFile(
  buffer: Buffer,
  userId: string,
  filename: string,
  fileId: string,
  type?: "avatar" | "banner",
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

  if (isR2Configured() && (await checkR2Connection())) {
    return uploadToR2({
      file: buffer,
      key: r2Key,
      contentType,
      userId,
    });
  }

  const localPath = path.join(process.cwd(), "uploads", ...r2Key.split("/"));
  const localDir = path.dirname(localPath);

  await fs.mkdir(localDir, { recursive: true });
  await fs.writeFile(localPath, buffer);

  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  return `${baseUrl}/api/upload/storage/${r2Key}`;
}
