import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import { getUserBadges } from "@/lib/utils";
import { ProfileContainer } from "@/components/ProfileContainer";
import type { Metadata } from "next";
import { UserProfile } from "@/types/profile";

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
      Media: {
        select: {
          id: true,
          createdAt: true,
          userId: true,
          type: true,
          url: true,
          filename: true,
          size: true,
          width: true,
          height: true,
          duration: true,
          public: true,
          domain: true,
        },
      },
      apiKeys: {
        select: {
          id: true,
        },
      },
      Shortlink: {
        select: {
          id: true,
        },
      },
    },
  });

  if (!user) {
    notFound();
  }

  const shortlinkStats = await prisma.shortlink.aggregate({
    where: { userId: user.id },
    _sum: {
      clicks: true,
    },
  });

  const userProfile: UserProfile = {
    ...user,
    profile: user.profile
      ? {
          ...user.profile,
          themeSettings: user.profile.themeSettings
            ? JSON.parse(JSON.stringify(user.profile.themeSettings))
            : null,
        }
      : {
          id: "",
          userId: user.id,
          title: null,
          description: null,
          avatarUrl: null,
          bannerUrl: null,
          theme: "default",
          themeSettings: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          socialLinks: [],
        },
    stats: {
      mediaCount: user.Media?.length || 0,
      storageUsed: user.storageUsed || 0,
      apiKeysCount: user.apiKeys?.length || 0,
      shortlinksCount: user.Shortlink?.length || 0,
      totalViews: shortlinkStats._sum.clicks || 0,
      memberSince: user.createdAt,
    },
  };

  const badges = getUserBadges(userProfile);

  return { user: userProfile, badges };
}

export async function generateProfileMetadata(id: string): Promise<Metadata> {
  const { user } = await getProfileData(id);

  return {
    title: `${user.profile?.title || user.name} - AnonHost`,
    description: user.profile?.description || undefined,
    openGraph: {
      title: `${user.profile?.title || user.name} - AnonHost`,
      description: user.profile?.description || undefined,
      images: user.profile?.avatarUrl
        ? [
            {
              url: user.profile.avatarUrl,
              width: 400,
              height: 400,
              alt: `${user.profile.title || user.name}'s avatar`,
            },
          ]
        : [],
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
  const { user, badges } = await getProfileData(id);
  return <ProfileContainer user={user} badges={badges} />;
}
