import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import { getUserBadges } from "@/lib/utils";
import { ProfileContainer } from "@/components/ProfileContainer";
import type { Metadata } from "next";
import { UserWithProfile, ProfileThemeSettings } from "@/types/profile";
import { Prisma } from "@prisma/client";

interface Props {
  id: string;
}

export async function getProfileData(id: string) {
  if (!id || isNaN(parseInt(id))) {
    notFound();
  }

  const uid = parseInt(id);
  const user = await prisma.user.findUnique({
    where: { uid },
    include: {
      profile: {
        include: {
          socialLinks: true,
        },
      },
    },
  });

  if (!user?.profile) {
    notFound();
  }

  let parsedThemeSettings: ProfileThemeSettings;
  if (user.profile.themeSettings) {
    parsedThemeSettings =
      typeof user.profile.themeSettings === "string"
        ? JSON.parse(user.profile.themeSettings)
        : user.profile.themeSettings;
  } else {
    parsedThemeSettings = {
      name: "default",
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
    };
  }

  const typedUser: UserWithProfile = {
    ...user,
    profile: {
      ...user.profile,
      themeSettings: parsedThemeSettings as Prisma.JsonValue & ProfileThemeSettings,
    },
  };

  const badges = getUserBadges(typedUser);
  const theme = typedUser.profile.theme || "default";

  return { user: typedUser, badges, theme };
}

export async function generateProfileMetadata(id: string): Promise<Metadata> {
  const { user } = await getProfileData(id);

  return {
    title: `${user.profile?.title || user.name} - AnonHost`,
    description: user.profile?.description || undefined,
    openGraph: {
      title: `${user.profile?.title || user.name} - AnonHost`,
      description: user.profile?.description || undefined,
      images: [
        ...(user.profile?.avatarUrl
          ? [
              {
                url: user.profile.avatarUrl,
                width: 400,
                height: 400,
                alt: `${user.profile.title || user.name}'s avatar`,
              },
            ]
          : []),
      ],
    },
    twitter: {
      card: user.profile?.bannerUrl ? "summary_large_image" : "summary",
      title: `${user.profile?.title || user.name} - AnonHost`,
      description: user.profile?.description || undefined,
      images: user.profile?.avatarUrl ? [user.profile?.avatarUrl] : undefined,
    },
  };
}

export default async function ProfileServer({ id }: Props) {
  const { user, badges, theme } = await getProfileData(id);
  return <ProfileContainer user={user} badges={badges} theme={theme} />;
}