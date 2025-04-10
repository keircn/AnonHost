import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import { getUserBadges } from "@/lib/utils";
import { ProfileContainer } from "@/components/ProfileContainer";
import type { Metadata } from "next";
import { UserWithProfile, ProfileThemeSettings } from "@/types/profile";

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

  if (user?.profile?.themeSettings) {
    user.profile.themeSettings = user.profile.themeSettings
      ? JSON.stringify(user.profile.themeSettings)
      : null;
  }

  if (!user?.profile) {
    notFound();
  }

  let parsedThemeSettings: ProfileThemeSettings | undefined;
  if (user.profile.themeSettings) {
    try {
      parsedThemeSettings = {
        name: "default",
        cardOpacity: 0.8,
        blurStrength: 5,
        layout: "default",
        colorScheme: {
          background: "#000000",
          text: "#ffffff",
          accent: "#000000",
        },
        ...JSON.parse(JSON.stringify(user.profile.themeSettings)),
      };
    } catch (e) {
      console.error("Failed to parse theme settings:", e);
    }
  }

  const typedUser: UserWithProfile = {
    ...user,
    profile: {
      ...user.profile,
      themeSettings: parsedThemeSettings
        ? JSON.parse(JSON.stringify(parsedThemeSettings))
        : {
            name: "default",
            cardOpacity: 0.8,
            blurStrength: 5,
            layout: "default",
            colorScheme: {
              background: "#000000",
              text: "#ffffff",
              accent: "#000000",
            },
          },
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
