import { promises as fs } from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import mime from "mime-types";

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } },
) {
  try {
    const filePath = path.join(process.cwd(), "uploads", ...params.path);

    const normalizedPath = path.normalize(filePath);
    if (!normalizedPath.startsWith(path.join(process.cwd(), "uploads"))) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    try {
      await fs.access(filePath);
    } catch {
      return new NextResponse("Not Found", { status: 404 });
    }

    const file = await fs.readFile(filePath);
    const contentType = mime.lookup(filePath) || "application/octet-stream";

    return new NextResponse(file, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000",
      },
    });
  } catch (error) {
    console.error("Error serving file:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
