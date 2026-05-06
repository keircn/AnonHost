import { NextRequest, NextResponse } from "next/server";
import {
  buildDownloadResponse,
  downloadPrivateUploadWithPassword,
} from "@/lib/server/private-upload";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await request.json().catch(() => null)) as { password?: unknown } | null;

  if (!body || typeof body.password !== "string") {
    return NextResponse.json({ error: "Password is required" }, { status: 400 });
  }

  try {
    const payload = await downloadPrivateUploadWithPassword({
      id,
      password: body.password,
    });
    const response = buildDownloadResponse(payload);
    return new NextResponse(response.body, { headers: response.headers });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Download failed";
    const status = message.includes("Invalid password") ? 401 : 404;
    return NextResponse.json({ error: message }, { status });
  }
}
