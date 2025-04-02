import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import { uploadImage } from "@/lib/upload";
import { verifyApiKey } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const apiKey = req.headers.get("authorization")?.split("Bearer ")[1];
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://keiran.cc";

  if (!session && !apiKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let userId: number;

  if (apiKey) {
    const user = await verifyApiKey(apiKey);
    if (!user) {
      return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
    }
    userId = Number(user.id);

    await prisma.apiKey.update({
      where: { key: apiKey },
      data: { lastUsed: new Date() },
    });
  } else {
    userId = session!.user.id;
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const customDomain = formData.get("domain") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const uploadResult = await uploadImage(file, userId.toString());

    const settings = await prisma.settings.findUnique({
      where: { userId },
      select: { customDomain: true },
    });

    const image = await prisma.image.create({
      data: {
        url: uploadResult.url,
        filename: uploadResult.filename,
        size: uploadResult.size,
        width: uploadResult.width,
        height: uploadResult.height,
        userId,
        public: formData.get("public") === "true",
        domain: customDomain || null,
      },
    });

    const imageUrl = image.domain
      ? `https://${image.domain}/${image.id}`
      : settings?.customDomain
        ? `https://${settings.customDomain}/${image.id}`
        : `${baseUrl}/${image.id}`;

    return NextResponse.json({
      id: image.id,
      url: imageUrl,
      filename: image.filename,
      size: image.size,
      width: image.width,
      height: image.height,
      public: image.public,
      domain: image.domain,
      createdAt: image.createdAt,
      baseUrl: baseUrl,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload image" },
      { status: 500 },
    );
  }
}
