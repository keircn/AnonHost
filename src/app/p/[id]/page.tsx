import { Metadata } from "next";
import Image from "next/image";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { getUserBadges } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { FaCrown } from "react-icons/fa";
import {
  FaGithub,
  FaTwitter,
  FaDiscord,
  FaTwitch,
  FaYoutube,
  FaInstagram,
  FaGlobe,
  FaFlask,
} from "react-icons/fa6";

interface Props {
  params: Promise<{ id: string }>;
}

const getPlatformIcon = (platform: string) => {
  const iconClass = "w-5 h-5";
  switch (platform.toLowerCase()) {
    case "github":
      return <FaGithub className={iconClass} />;
    case "twitter":
      return <FaTwitter className={iconClass} />;
    case "discord":
      return <FaDiscord className={iconClass} />;
    case "twitch":
      return <FaTwitch className={iconClass} />;
    case "youtube":
      return <FaYoutube className={iconClass} />;
    case "instagram":
      return <FaInstagram className={iconClass} />;
    default:
      return <FaGlobe className={iconClass} />;
  }
};

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
          ...(user.profile.avatarUrl ? [{ 
            url: user.profile.avatarUrl,
            width: 400,
            height: 400,
            alt: `${user.profile.title || user.name}'s avatar`
          }] : []),
        ],
      },
      twitter: {
        card: user.profile.bannerUrl ? "summary_large_image" : "summary",
        title: `${user.profile.title || user.name} - AnonHost`,
        description: user.profile.description || undefined,
        images: user.profile.avatarUrl ? [user.profile.avatarUrl] : undefined,
      }
    };
  }

export default async function ProfilePage({ params }: Props) {
  const resolvedParams = await params;
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

  const getBadgeIcon = (label: string) => {
    switch (label) {
      case "Premium":
        return <FaCrown className="w-5 h-5 text-[#a855f7]" />;
      case "Beta":
        return <FaFlask className="w-5 h-5 text-[#3b82f6]" />;
      default:
        return null;
    }
  };

  const badges = getUserBadges(user);

  const theme = user.profile.theme || "default";
  const themeStyles = {
    default: "",
    dark: "bg-gray-950",
    gradient: "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900",
  };

  console.log("User profile:", user?.profile);
  console.log("Social links:", user?.profile?.socialLinks);

  return (
    <div
      className={`min-h-screen flex flex-col items-center justify-center p-4 ${themeStyles[theme as keyof typeof themeStyles]}`}
    >
      {user.profile.bannerUrl && (
        <div
          className="fixed inset-0 z-0"
          style={{
            backgroundImage: `url(${user.profile.bannerUrl})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            filter: "blur(8px) brightness(0.5)",
          }}
        />
      )}

      <div className="w-full max-w-2xl z-10">
        <Card className="backdrop-blur-sm bg-background/80 shadow-xl">
          <CardContent className="p-8">
            <div className="flex flex-col items-center text-center gap-6">
              <div className="relative w-32 h-32 rounded-full border-4 border-background/80 overflow-hidden bg-muted shadow-xl">
                {user.profile.avatarUrl ? (
                  <Image
                    src={user.profile.avatarUrl}
                    alt="Avatar"
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-900" />
                )}
              </div>

              <div className="space-y-2">
                <h1 className="text-3xl font-bold">
                  {user.profile.title || user.name}
                </h1>

                {badges.length > 0 && (
                  <div className="flex justify-center gap-2">
                    <TooltipProvider>
                      {badges.map((badge) => (
                        <Tooltip key={badge.label}>
                          <TooltipTrigger>
                            <div className="p-1.5 rounded-full hover:bg-background/50 transition-colors">
                              {getBadgeIcon(badge.label)}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>
                              {badge.emoji} {badge.label}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      ))}
                    </TooltipProvider>
                  </div>
                )}

                {user.profile.description && (
                  <p className="text-lg text-muted-foreground whitespace-pre-wrap max-w-lg mx-auto mt-4">
                    {user.profile.description}
                  </p>
                )}

                {user.profile.socialLinks &&
                  user.profile.socialLinks.length > 0 && (
                    <div className="flex justify-center gap-3 mt-4">
                      {user.profile.socialLinks.map((link) => (
                        <TooltipProvider key={link.id}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <a
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 rounded-full hover:bg-background/50 transition-colors"
                              >
                                {getPlatformIcon(link.platform)}
                              </a>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="capitalize">{link.platform}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ))}
                    </div>
                  )}
              </div>
            </div>
          </CardContent>
        </Card>

        {user.Media && user.Media.length > 0 && (
          <div className="mt-8 backdrop-blur-sm bg-background/80 p-6 rounded-lg shadow-xl">
            <h2 className="text-xl font-semibold mb-6 text-center">
              Recent Public Uploads
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {user.Media.map((media) => (
                <a
                  key={media.id}
                  href={`/${media.id}`}
                  className="relative aspect-video rounded-lg overflow-hidden bg-muted hover:scale-105 transition-transform duration-200 shadow-lg"
                >
                  {media.type === "VIDEO" ? (
                    <video
                      src={`${media.url}?thumb=1`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Image
                      src={media.url}
                      alt={media.filename}
                      fill
                      className="object-cover"
                    />
                  )}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export const dynamic = "force-dynamic";
export const revalidate = 60;
