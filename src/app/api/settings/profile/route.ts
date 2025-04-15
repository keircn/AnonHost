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

    if (!data || Object.keys(data).length === 0) {
      return NextResponse.json({ error: "No data provided" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { profile: { include: { socialLinks: true } } },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Convert empty strings to null for database storage
    const sanitizedData = {
      title: data.title === "" ? null : data.title,
      description: data.description === "" ? null : data.description,
      avatarUrl: data.avatarUrl === "" ? null : data.avatarUrl,
      bannerUrl: data.bannerUrl === "" ? null : data.bannerUrl,
      theme: data.theme || "default",
      themeSettings: data.themeSettings,
      socialLinks: data.socialLinks,
    };

    const profile = await prisma.profile.upsert({
      where: { userId: user.id },
      update: {
        ...(sanitizedData.title !== undefined && { title: sanitizedData.title }),
        ...(sanitizedData.description !== undefined && { description: sanitizedData.description }),
        ...(sanitizedData.avatarUrl !== undefined && { avatarUrl: sanitizedData.avatarUrl }),
        ...(sanitizedData.bannerUrl !== undefined && { bannerUrl: sanitizedData.bannerUrl }),
        ...(sanitizedData.theme && { theme: sanitizedData.theme }),
        ...(sanitizedData.themeSettings && { themeSettings: sanitizedData.themeSettings }),
        ...(sanitizedData.socialLinks && {
          socialLinks: {
            deleteMany: {},
            create: sanitizedData.socialLinks.map((link) => ({
              platform: link.platform,
              url: link.url,
            })),
          },
        }),
      },
      create: {
        userId: user.id,
        title: sanitizedData.title,
        description: sanitizedData.description,
        avatarUrl: sanitizedData.avatarUrl,
        bannerUrl: sanitizedData.bannerUrl,
        theme: sanitizedData.theme,
        themeSettings: sanitizedData.themeSettings ?? {
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
        socialLinks: {
          create: sanitizedData.socialLinks?.map((link) => ({
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
