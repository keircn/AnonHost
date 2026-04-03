import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { promises as fs } from "fs";
import mime from "mime-types";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  try {
    const { path: filePathParts } = await params;
    const filePath = path.join("/" + filePathParts.join("/"));
    const normalized = filePath.replace(/^\/+/, "");
    const fullPath = path.join(process.cwd(), normalized);
    const buffer = await fs.readFile(fullPath);
    const contentType = mime.lookup(fullPath) || "application/octet-stream";

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000",
      },
    });
  } catch (error) {
    console.error("Error serving file:", error);
    return new NextResponse("File not found", { status: 404 });
  }
}
