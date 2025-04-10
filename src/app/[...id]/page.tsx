import { Metadata } from "next";
import { MediaActions } from "@/components/MediaActions";
import Image from "next/image";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { betaMembers } from "@/lib/beta";
import { Viewport } from "next";
import { LuMusic } from "react-icons/lu";

interface Props {
  params: Promise<{ id?: string[] }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    hour12: false,
  }).format(date);
}

function getUserBadges(user: { id?: string; premium?: boolean } | null) {
  const badges: Array<{
    emoji: string;
    label: string;
    color?: string;
  }> = [];

  if (user?.premium) {
    badges.push({
      emoji: "💎",
      label: "Premium",
      color: "#a855f7",
    });
  }

  if (user?.id && betaMembers.includes(user.id)) {
    badges.push({
      emoji: "🧪",
      label: "Beta",
      color: "#3b82f6",
    });
  }

  return badges;
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const { id } = params;
  const mediaId = id?.[0];

  if (!mediaId) {
    return {
      title: "Media not found",
      description: "The requested media could not be found.",
    };
  }

  const media = await prisma.media.findUnique({
    where: { id: mediaId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          premium: true,
        },
      },
    },
  });

  if (!media) {
    return {
      title: "Media not found",
      description: "The requested media could not be found.",
    };
  }

  const badges = getUserBadges(media.user);
  const badgeString = badges.length
    ? `\n${badges.map((b) => `${b.emoji} ${b.label}`).join(" • ")}`
    : "";

  const premiumTheme = media.user?.premium
    ? {
        themeColor: badges[0]?.color || "#a855f7",
        creator: media.user.name,
        applicationName: "AnonHost Premium",
        other: {
          badges: badges.map((b) => `${b.emoji} ${b.label}`),
          ...(badges[0]?.color && { badgeColor: badges[0].color }),
        },
      }
    : {};

  const description = `${media.user?.premium ? "⭐ " : ""}Uploaded by ${
    media.user?.name || "Anonymous"
  }\n📁 ${formatBytes(media.size)}\n📅 ${formatDate(media.createdAt)}${badges.length ? "\n" : ""}${badgeString}`;

  const dimensions = {
    width: typeof media.width === "number" ? media.width : 1280,
    height: typeof media.height === "number" ? media.height : 720,
  };

  if (media.type === "VIDEO") {
    return {
      title: `${badges.map((b) => b.emoji + " ").join("")}${media.filename || "Untitled"}`,
      description,
      ...premiumTheme,
      openGraph: {
        title: `${badges.map((b) => b.emoji + " ").join("")}${media.filename || "Untitled"}`,
        description,
        type: "video.other",
        url: media.url,
        siteName: media.user?.premium ? "AnonHost Premium" : "AnonHost",
        videos: [
          {
            url: media.url,
            width: dimensions.width,
            height: dimensions.height,
            type: "video/mp4",
          },
        ],
        images: [
          {
            url: `${media.url}?thumb=1`,
            width: dimensions.width,
            height: dimensions.height,
            alt: media.filename || "Video thumbnail",
          },
        ],
      },
      twitter: {
        card: "player",
        title: media.filename || "Untitled",
        description,
        images: [`${media.url}?thumb=1`],
        players: [
          {
            playerUrl: media.url,
            streamUrl: media.url,
            width: dimensions.width,
            height: dimensions.height,
          },
        ],
      },
    };
  }

  return {
    title: media.filename || "Untitled",
    description,
    ...premiumTheme,
    openGraph: {
      title: `${media.user?.premium ? "⭐ " : ""}${media.filename || "Untitled"}`,
      description,
      type: "website",
      url: media.url,
      siteName: media.user?.premium ? "AnonHost Premium" : "AnonHost",
      images: [
        {
          url: media.url,
          width: dimensions.width,
          height: dimensions.height,
          alt: media.filename || "Image",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${media.user?.premium ? "⭐ " : ""}${media.filename || "Untitled"}`,
      description,
      images: [media.url],
      creator: media.user?.premium ? (media.user.name ?? undefined) : undefined,
    },
  };
}

export async function generateViewport(): Promise<Viewport> {
  return {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  };
}

export default async function MediaPage(props: Props) {
  const params = await props.params;
  const { id } = params;
  const mediaId = id?.[0];

  if (!mediaId) {
    notFound();
    return null;
  }

  const media = await prisma.media.findUnique({
    where: { id: mediaId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          premium: true,
        },
      },
    },
  });

  if (!media) {
    notFound();
    return null;
  }

  return (
    <div className="container py-8">
      <Card className="max-w-4xl mx-auto">
        <div className="relative aspect-video">
          {(() => {
            switch (media.type) {
              case "VIDEO":
                return (
                  <video
                    src={media.url}
                    controls
                    className="w-full h-full"
                    autoPlay
                    playsInline
                  />
                );
              case "AUDIO":
                return (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-4 bg-muted/20">
                    <LuMusic className="h-24 w-24 text-muted-foreground" />
                    <audio controls className="w-3/4 max-w-xl">
                      <source src={media.url} type="audio/mpeg" />
                      Your browser does not support the audio element.
                    </audio>
                  </div>
                );
              default:
                return (
                  <Image
                    src={media.url}
                    alt={media.filename}
                    fill
                    className="object-contain py-8"
                    priority
                  />
                );
            }
          })()}
        </div>
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold text-foreground">
                {media.filename}
              </h1>
              {media.user?.premium && (
                <span className="px-2 py-1 text-xs font-medium bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full">
                  Premium
                </span>
              )}
              {media.user?.id && betaMembers.includes(media.user.id) && (
                <span className="px-2 py-1 text-xs font-medium bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full">
                  Beta
                </span>
              )}
            </div>
            <MediaActions url={media.url} filename={media.filename} />
          </div>

          <div className="grid grid-cols-4 gap-6">
            <Card>
              <CardHeader className="p-4">
                <h3 className="text-sm font-medium text-foreground">
                  Uploader
                </h3>
                <p className="text-sm font-semibold text-muted-foreground">
                  {media.user?.name || "Anonymous"}
                </p>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="p-4">
                <h3 className="text-sm font-medium text-foreground">Type</h3>
                <p className="text-sm font-semibold text-muted-foreground">
                  {media.type}
                </p>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="p-4">
                <h3 className="text-sm font-medium text-foreground">Size</h3>
                <p className="text-sm font-semibold text-muted-foreground">
                  {formatBytes(media.size)}
                </p>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="p-4">
                <h3 className="text-sm font-medium text-foreground">
                  Uploaded
                </h3>
                <p className="text-sm font-semibold text-muted-foreground">
                  {formatDate(media.createdAt)}
                </p>
              </CardHeader>
            </Card>
          </div>

          {media.type === "VIDEO" && media.duration && (
            <Card className="mt-6">
              <CardHeader className="p-4">
                <h3 className="text-sm font-medium text-foreground">
                  Duration
                </h3>
                <p className="text-sm font-semibold text-muted-foreground">
                  {Math.floor(media.duration / 60)}:
                  {(media.duration % 60).toString().padStart(2, "0")}
                </p>
              </CardHeader>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
