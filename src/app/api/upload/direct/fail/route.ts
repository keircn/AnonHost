import { NextRequest, NextResponse } from "next/server";
import { markDirectUploadFailed } from "@/app/upload/direct/actions";

type FailBody = {
  imageId?: unknown;
};

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as FailBody | null;

  if (!body) {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  if (typeof body.imageId !== "string") {
    return NextResponse.json({ ok: false, error: "imageId must be a string" }, { status: 400 });
  }

  const result = await markDirectUploadFailed(body.imageId);

  if (!result.ok) {
    const status = result.error === "Unauthorized" ? 401 : 400;
    return NextResponse.json(result, { status });
  }

  return NextResponse.json(result);
}
