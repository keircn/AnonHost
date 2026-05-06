import { NextResponse } from "next/server";
import { buildDownloadResponse, downloadPrivateUploadWithToken } from "@/lib/server/private-upload";

export async function GET(_: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  try {
    const payload = await downloadPrivateUploadWithToken(token);
    const response = buildDownloadResponse(payload);
    return new NextResponse(response.body, { headers: response.headers });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Download failed";
    return NextResponse.json({ error: message }, { status: 404 });
  }
}
