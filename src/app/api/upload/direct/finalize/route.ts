import { NextRequest, NextResponse } from "next/server";
import { finalizeDirectUpload } from "@/app/upload/direct/actions";

type FinalizeBody = {
  imageId?: unknown;
  objectKey?: unknown;
  public?: unknown;
  disableEmbed?: unknown;
  domain?: unknown;
};

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as FinalizeBody | null;

  if (!body) {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  if (typeof body.imageId !== "string") {
    return NextResponse.json({ ok: false, error: "imageId must be a string" }, { status: 400 });
  }

  if (typeof body.objectKey !== "string") {
    return NextResponse.json({ ok: false, error: "objectKey must be a string" }, { status: 400 });
  }

  const result = await finalizeDirectUpload({
    imageId: body.imageId,
    objectKey: body.objectKey,
    public: typeof body.public === "boolean" ? body.public : false,
    disableEmbed: typeof body.disableEmbed === "boolean" ? body.disableEmbed : false,
    domain: typeof body.domain === "string" ? body.domain : null,
  });

  if (!result.ok) {
    const status = result.error === "Unauthorized" ? 401 : 400;
    return NextResponse.json(result, { status });
  }

  return NextResponse.json(result);
}
