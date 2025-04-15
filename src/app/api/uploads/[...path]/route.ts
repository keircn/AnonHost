import { NextRequest, NextResponse } from "next/server";
import { getFile } from "@/lib/server/storage";

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } },
) {
  try {
    const filePath = `uploads/${params.path.join("/")}`;
    const { buffer, contentType } = await getFile(filePath);

    return new NextResponse(buffer, {
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
