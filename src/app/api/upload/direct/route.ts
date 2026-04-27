import { NextRequest, NextResponse } from "next/server";
import { createDirectUpload } from "@/app/upload/direct/actions";

type CreateDirectUploadBody = {
  fileName?: unknown;
  fileSize?: unknown;
  contentType?: unknown;
};

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as CreateDirectUploadBody | null;

  if (!body) {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  if (typeof body.fileName !== "string") {
    return NextResponse.json({ ok: false, error: "fileName must be a string" }, { status: 400 });
  }

  if (typeof body.fileSize !== "number") {
    return NextResponse.json({ ok: false, error: "fileSize must be a number" }, { status: 400 });
  }

  if (typeof body.contentType !== "string") {
    return NextResponse.json({ ok: false, error: "contentType must be a string" }, { status: 400 });
  }

  const result = await createDirectUpload({
    fileName: body.fileName,
    fileSize: body.fileSize,
    contentType: body.contentType,
  });

  if (!result.ok) {
    const status = result.error === "Unauthorized" ? 401 : 400;
    return NextResponse.json(result, { status });
  }

  return NextResponse.json(result);
}
