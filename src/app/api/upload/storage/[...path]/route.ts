import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import mime from "mime-types";

const rateLimitMap = new Map<string, { count: number; timestamp: number }>();
const RATE_LIMIT = 100;
const RATE_LIMIT_WINDOW = 60 * 60 * 1000;

async function checkRateLimit(ip: string): Promise<boolean> {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record) {
    rateLimitMap.set(ip, { count: 1, timestamp: now });
    return true;
  }

  if (now - record.timestamp > RATE_LIMIT_WINDOW) {
    rateLimitMap.set(ip, { count: 1, timestamp: now });
    return true;
  }

  if (record.count >= RATE_LIMIT) {
    return false;
  }

  record.count++;
  return true;
}

async function ensureUploadDirectory() {
  const uploadDir = path.join(process.cwd(), "uploads");
  try {
    await fs.access(uploadDir);
  } catch {
    await fs.mkdir(uploadDir, { recursive: true, mode: 0o755 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } },
) {
  const parts = await params.path;
  const ip =
    request.headers.get("x-real-ip") ||
    request.headers.get("x-forwarded-for") ||
    "unknown";

  if (!(await checkRateLimit(ip))) {
    return new NextResponse("Too Many Requests", {
      status: 429,
      headers: {
        "Retry-After": "3600",
      },
    });
  }

  try {
    await ensureUploadDirectory();
    const filePath = path.join(process.cwd(), "uploads", ...parts);

    const normalizedPath = path.normalize(filePath);
    const uploadDir = path.join(process.cwd(), "uploads");
    if (!normalizedPath.startsWith(uploadDir)) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    try {
      const file = await fs.readFile(filePath);
      const stats = await fs.stat(filePath);
      const contentType = mime.lookup(filePath) || "application/octet-stream";

      const headers = new Headers({
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000",
        "Content-Length": stats.size.toString(),
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy":
          "default-src 'none'; img-src 'self'; media-src 'self'",
        "Access-Control-Allow-Origin": process.env.NEXTAUTH_URL || "*",
        "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
      });

      return new NextResponse(file, { headers });
    } catch {
      return new NextResponse("File not found", { status: 404 });
    }
  } catch (error) {
    console.error("Error serving file:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// this function will be used in future updates
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function cleanupOldFiles() {
  const MAX_AGE = 30 * 24 * 60 * 60 * 1000;
  const uploadDir = path.join(process.cwd(), "uploads");

  try {
    const files = await fs.readdir(uploadDir, { withFileTypes: true });
    const now = Date.now();

    for (const file of files) {
      if (!file.isDirectory()) {
        const filePath = path.join(uploadDir, file.name);
        const stats = await fs.stat(filePath);
        const age = now - stats.mtimeMs;

        if (age > MAX_AGE) {
          await fs.unlink(filePath);
        }
      }
    }
  } catch (error) {
    console.error("Error cleaning up files:", error);
  }
}
