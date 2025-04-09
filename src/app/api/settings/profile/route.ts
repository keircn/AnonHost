import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import { ProfileUpdateData } from "@/types/profile";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        profile: {
          include: {
            socialLinks: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(
      user.profile || {
        title: "",
        description: "",
        avatarUrl: "",
        bannerUrl: "",
        theme: "default",
        themeSettings: {
          cardOpacity: 60,
          blurStrength: 5,
          layout: "default",
          colorScheme: {
            background: "",
            text: "",
            accent: "",
          },
          effects: {
            particles: false,
            gradientAnimation: false,
            imageParallax: false,
          },
        },
        socialLinks: [],
      },
    );
  } catch (error) {
    console.error("Failed to fetch profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 },
    );
  }
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = (await req.json()) as ProfileUpdateData;

    if (!data) {
      return NextResponse.json({ error: "No data provided" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { profile: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const profile = await prisma.profile.upsert({
      where: { userId: user.id },
      update: {
        title: data.title ?? null,
        description: data.description ?? null,
        avatarUrl: data.avatarUrl ?? null,
        bannerUrl: data.bannerUrl ?? null,
        theme: data.theme ?? "default",
        themeSettings: {
          cardOpacity: data.themeSettings?.cardOpacity ?? 60,
          blurStrength: data.themeSettings?.blurStrength ?? 5,
          layout: data.themeSettings?.layout ?? "default",
          colorScheme: {
            background: data.themeSettings?.colorScheme?.background ?? "",
            text: data.themeSettings?.colorScheme?.text ?? "",
            accent: data.themeSettings?.colorScheme?.accent ?? "",
          },
          effects: {
            particles: data.themeSettings?.effects?.particles ?? false,
            gradientAnimation:
              data.themeSettings?.effects?.gradientAnimation ?? false,
            imageParallax: data.themeSettings?.effects?.imageParallax ?? false,
          },
        },
        socialLinks: {
          deleteMany: {},
          create:
            data.socialLinks?.map((link) => ({
              platform: link.platform,
              url: link.url,
            })) ?? [],
        },
      },
      create: {
        userId: user.id,
        title: data.title ?? null,
        description: data.description ?? null,
        avatarUrl: data.avatarUrl ?? null,
        bannerUrl: data.bannerUrl ?? null,
        theme: data.theme ?? "default",
        themeSettings: {
          cardOpacity: data.themeSettings?.cardOpacity ?? 60,
          blurStrength: data.themeSettings?.blurStrength ?? 5,
          layout: data.themeSettings?.layout ?? "default",
          colorScheme: {
            background: data.themeSettings?.colorScheme?.background ?? "",
            text: data.themeSettings?.colorScheme?.text ?? "",
            accent: data.themeSettings?.colorScheme?.accent ?? "",
          },
          effects: {
            particles: data.themeSettings?.effects?.particles ?? false,
            gradientAnimation:
              data.themeSettings?.effects?.gradientAnimation ?? false,
            imageParallax: data.themeSettings?.effects?.imageParallax ?? false,
          },
        },
        socialLinks: {
          create:
            data.socialLinks?.map((link) => ({
              platform: link.platform,
              url: link.url,
            })) ?? [],
        },
      },
      include: {
        socialLinks: true,
      },
    });

    return NextResponse.json(profile);
  } catch (error) {
    console.error("Failed to update profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 },
    );
  }
}
