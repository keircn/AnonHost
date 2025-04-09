"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { FaCrown, FaFlask } from "react-icons/fa";
import {
  FaGithub,
  FaTwitter,
  FaDiscord,
  FaTwitch,
  FaYoutube,
  FaInstagram,
  FaGlobe,
} from "react-icons/fa6";
import { SocialLink, UserWithProfile } from "@/types/profile";
import { cn } from "@/lib/utils";

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

const staggerContainer = {
  animate: {
    transition: { staggerChildren: 0.1 },
  },
};

const imageHover = {
  hover: {
    scale: 1.05,
    transition: { duration: 0.2 },
  },
};

interface ProfileContentProps {
  user: UserWithProfile;
  badges: Array<{ label: string; emoji: string }>;
  theme: string;
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

export function ProfileContent({ user, badges, theme }: ProfileContentProps) {
  const themeStyles = {
    default: "",
    dark: "bg-gray-950",
    gradient: "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900",
  };

  const layoutStyles = {
    default: {
      container: "max-w-2xl",
      content: "p-8",
      avatar: "w-32 h-32",
    },
    minimal: {
      container: "max-w-xl",
      content: "p-6 bg-transparent",
      avatar: "w-24 h-24",
    },
    centered: {
      container: "max-w-2xl mx-auto",
      content: "p-8 text-center",
      avatar: "w-40 h-40",
    },
    grid: {
      container: "max-w-4xl",
      content: "p-8 grid grid-cols-1 md:grid-cols-2 gap-6",
      avatar: "w-32 h-32 md:w-48 md:h-48",
    },
  };

  const currentLayout = user.profile.themeSettings?.layout || "default";
  const layout = layoutStyles[currentLayout as keyof typeof layoutStyles];

  return (
    <motion.div
      className={`min-h-screen flex flex-col items-center justify-center p-4 ${themeStyles[theme as keyof typeof themeStyles]}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {user.profile.bannerUrl && (
        <motion.div
          className="fixed inset-0 z-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
          style={{
            backgroundImage: `url(${user.profile.bannerUrl})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            filter: "blur(1px) brightness(0.8)",
          }}
        />
      )}

      <motion.div
        className={cn("w-full z-10", layout.container)}
        variants={fadeIn}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        <Card className={cn("backdrop-blur-sm shadow-xl")}>
          <CardContent className={layout.content}>
            <motion.div
              className="flex flex-col items-center text-center gap-6"
              variants={staggerContainer}
              initial="initial"
              animate="animate"
            >
              <motion.div
                className={cn(
                  "relative rounded-full border-4 border-background/80 overflow-hidden bg-muted shadow-xl",
                  layout.avatar,
                )}
                variants={fadeIn}
                whileHover={imageHover.hover}
              >
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
              </motion.div>

              <motion.div className="space-y-2" variants={fadeIn}>
                <motion.h1 className="text-3xl font-bold" variants={fadeIn}>
                  {user.profile.title || user.name}
                </motion.h1>

                {badges.length > 0 && (
                  <motion.div
                    className="flex justify-center gap-2"
                    variants={fadeIn}
                  >
                    <TooltipProvider>
                      {badges.map((badge, index) => (
                        <motion.div
                          key={badge.label}
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <Tooltip>
                            <TooltipTrigger>
                              <motion.div
                                whileHover={{ scale: 1.2 }}
                                whileTap={{ scale: 0.9 }}
                              >
                                {getBadgeIcon(badge.label)}
                              </motion.div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>
                                {badge.emoji} {badge.label}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </motion.div>
                      ))}
                    </TooltipProvider>
                  </motion.div>
                )}

                {user.profile.description && (
                  <motion.p
                    className="text-lg text-muted-foreground whitespace-pre-wrap max-w-lg mx-auto mt-4"
                    variants={fadeIn}
                  >
                    {user.profile.description}
                  </motion.p>
                )}

                {user.profile.socialLinks &&
                  user.profile.socialLinks.length > 0 && (
                    <motion.div
                      className="flex justify-center gap-3 mt-4"
                      variants={fadeIn}
                    >
                      {user.profile.socialLinks.map(
                        (link: SocialLink, index: number) => (
                          <TooltipProvider key={link.id}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <motion.a
                                  href={link.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-2 rounded-full hover:bg-background/50 transition-colors"
                                  whileHover={{ scale: 1.2 }}
                                  whileTap={{ scale: 0.9 }}
                                  initial={{ opacity: 0, scale: 0 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{
                                    opacity: { delay: index * 0.1 },
                                    scale: { delay: 0 },
                                  }}
                                >
                                  {getPlatformIcon(link.platform)}
                                </motion.a>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="capitalize">{link.platform}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ),
                      )}
                    </motion.div>
                  )}
              </motion.div>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
