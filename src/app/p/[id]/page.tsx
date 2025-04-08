import { Metadata } from "next";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import { getUserBadges } from "@/lib/utils";
import { ProfileContent } from "@/components/ProfileContent";
import { useNavbar } from '@/components/NavbarContext';
import { useEffect } from "react";

interface Props {
  params: Promise<{ id: string }>;
}

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  if (!resolvedParams.id || isNaN(parseInt(resolvedParams.id))) {
    return { title: "Profile not found" };
  }

  const uid = parseInt(resolvedParams.id);
  const user = await prisma.user.findUnique({
    where: { uid },
    include: {
      profile: {
        include: {
          socialLinks: true,
        },
      },
      Media: {
        take: 12,
        orderBy: { createdAt: "desc" },
        where: { public: true },
      },
    },
  });

  if (!user?.profile) {
    return { title: "Profile not found" };
  }

  return {
    title: `${user.profile.title || user.name} - AnonHost`,
    description: user.profile.description || undefined,
    openGraph: {
      title: `${user.profile.title || user.name} - AnonHost`,
      description: user.profile.description || undefined,
      images: [
        ...(user.profile.avatarUrl
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
      card: user.profile.bannerUrl ? "summary_large_image" : "summary",
      title: `${user.profile.title || user.name} - AnonHost`,
      description: user.profile.description || undefined,
      images: user.profile.avatarUrl ? [user.profile.avatarUrl] : undefined,
    },
  };
}

export default async function ProfilePage({ params }: Props) {
  const resolvedParams = await params;
  const { setShowNavbar } = useNavbar();

  useEffect(() => {
    setShowNavbar(false);
    return () => setShowNavbar(true);
  }, [setShowNavbar]);

  if (!resolvedParams.id || isNaN(parseInt(resolvedParams.id))) {
    notFound();
  }

  const uid = parseInt(resolvedParams.id);
  const user = await prisma.user.findUnique({
    where: { uid },
    include: {
      profile: {
        include: {
          socialLinks: true,
        },
      },
      Media: {
        take: 12,
        orderBy: { createdAt: "desc" },
        where: { public: true },
      },
    },
  });

  if (!user?.profile) {
    notFound();
  }

  const badges = getUserBadges(user);
  const theme = user.profile.theme || "default";

  return <ProfileContent user={user} badges={badges} theme={theme} />;
}

export const dynamic = "force-dynamic";
export const revalidate = 60;
