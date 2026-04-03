import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";
import { settings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  const [existing] = await db.select().from(settings).where(eq(settings.userId, userId)).limit(1);

  let result = existing;

  if (!result) {
    [result] = await db
      .insert(settings)
      .values({
        userId,
        enableNotifications: true,
        makeImagesPublic: false,
        enableDirectLinks: true,
        disableEmbedByDefault: false,
        embedTitleTemplate: "{{filename}}",
        embedDescriptionTemplate: "Uploaded by {{uploader}}",
        embedSiteName: "AnonHost",
        embedAccentColor: "#0ea5e9",
      })
      .returning();
  }

  return NextResponse.json(result);
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    const data = await req.json();

    const validSettings = {
      enableNotifications: Boolean(data.enableNotifications),
      makeImagesPublic: Boolean(data.makeImagesPublic),
      enableDirectLinks: Boolean(data.enableDirectLinks),
      disableEmbedByDefault: Boolean(data.disableEmbedByDefault),
      embedTitleTemplate: String(data.embedTitleTemplate || "{{filename}}").slice(0, 150),
      embedDescriptionTemplate: String(
        data.embedDescriptionTemplate || "Uploaded by {{uploader}}",
      ).slice(0, 300),
      embedSiteName: String(data.embedSiteName || "AnonHost").slice(0, 120),
      embedAccentColor: /^#[0-9a-fA-F]{6}$/.test(String(data.embedAccentColor || ""))
        ? String(data.embedAccentColor)
        : "#0ea5e9",
      customDomain: data.customDomain || null,
    };

    const [existing] = await db.select().from(settings).where(eq(settings.userId, userId)).limit(1);

    let result;
    if (existing) {
      [result] = await db
        .update(settings)
        .set(validSettings)
        .where(eq(settings.userId, userId))
        .returning();
    } else {
      [result] = await db
        .insert(settings)
        .values({ userId, ...validSettings })
        .returning();
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to update settings:", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
