"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { formatDistance } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { FaCrown, FaFlask, FaCode } from "react-icons/fa";
import {
  FaGithub,
  FaTwitter,
  FaDiscord,
  FaTwitch,
  FaYoutube,
  FaInstagram,
  FaGlobe,
  FaImage,
  FaLink,
  FaKey,
  FaEye,
  FaCalendar,
  FaDatabase,
} from "react-icons/fa6";
import { SocialLink, UserProfile } from "@/types/profile";
import { formatFileSize } from "@/lib/utils";

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

interface ProfileContentProps {
  user: UserProfile;
  badges: Array<{ label: string; emoji: string }>;
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
      return <FaCrown className="w-5 h-5 text-amber-400" />;
    case "Beta":
      return <FaFlask className="w-5 h-5 text-blue-500" />;
    case "Admin":
      return <FaCode className="w-5 h-5 text-red-500" />;
    default:
      return null;
  }
};

export function ProfileContent({ user, badges }: ProfileContentProps) {
  return (
    <motion.div
      className="min-h-screen flex flex-col items-center justify-center p-4"
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
            filter: "blur(5px) brightness(0.5)",
          }}
        />
      )}

      <motion.div
        className="w-full max-w-4xl z-10"
        variants={fadeIn}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        <Card className="backdrop-blur-lg bg-black/50 shadow-xl border-gray-800">
          <CardContent className="p-8">
            <motion.div
              className="grid grid-cols-1 md:grid-cols-3 gap-8"
              variants={staggerContainer}
              initial="initial"
              animate="animate"
            >
              {/* Profile Sidebar */}
              <motion.div
                className="flex flex-col items-center text-center gap-6"
                variants={fadeIn}
              >
                <motion.div
                  className="relative w-40 h-40 rounded-full border-4 border-blue-500/30 overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900 shadow-xl"
                  variants={fadeIn}
                  whileHover={{ scale: 1.05 }}
                >
                  {user.profile.avatarUrl ? (
                    <Image
                      src={user.profile.avatarUrl}
                      alt="Avatar"
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-900 to-purple-900 flex items-center justify-center text-4xl text-white font-bold">
                      {user.name?.charAt(0) || "A"}
                    </div>
                  )}
                </motion.div>

                <motion.div className="space-y-3" variants={fadeIn}>
                  <motion.h1 className="text-3xl font-bold text-white" variants={fadeIn}>
                    {user.profile.title || user.name}
                  </motion.h1>

                  {/* Badges */}
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
                                  className="p-2 bg-gray-800/50 rounded-full"
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

                  {/* User Bio */}
                  {user.profile.description && (
                    <motion.p
                      className="text-md text-gray-300 whitespace-pre-wrap max-w-sm mx-auto mt-4"
                      variants={fadeIn}
                    >
                      {user.profile.description}
                    </motion.p>
                  )}

                  {/* Social Links */}
                  {user.profile.socialLinks && user.profile.socialLinks.length > 0 && (
                    <motion.div
                      className="flex justify-center gap-3 mt-6"
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
                                  className="p-2 rounded-full bg-gray-800/60 hover:bg-gray-700 transition-colors"
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
                        )
                      )}
                    </motion.div>
                  )}
                </motion.div>
              </motion.div>

              {/* User Stats */}
              <motion.div
                className="md:col-span-2 space-y-6"
                variants={fadeIn}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h2 className="text-2xl font-bold text-white border-b border-gray-700 pb-2">
                  User Stats
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Media Stats */}
                  <Card className="bg-gray-800/40 border-gray-700 overflow-hidden group hover:bg-gray-800/60 transition-colors">
                    <CardContent className="p-4 flex items-center space-x-4">
                      <div className="p-3 rounded-full bg-blue-500/20 text-blue-400 group-hover:bg-blue-500/30 transition-colors">
                        <FaImage className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Media Files</p>
                        <p className="text-white text-xl font-bold">{user.stats.mediaCount}</p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Storage Usage */}
                  <Card className="bg-gray-800/40 border-gray-700 overflow-hidden group hover:bg-gray-800/60 transition-colors">
                    <CardContent className="p-4 flex items-center space-x-4">
                      <div className="p-3 rounded-full bg-purple-500/20 text-purple-400 group-hover:bg-purple-500/30 transition-colors">
                        <FaDatabase className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Storage Used</p>
                        <p className="text-white text-xl font-bold">{formatFileSize(user.stats.storageUsed)}</p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Shortlinks */}
                  <Card className="bg-gray-800/40 border-gray-700 overflow-hidden group hover:bg-gray-800/60 transition-colors">
                    <CardContent className="p-4 flex items-center space-x-4">
                      <div className="p-3 rounded-full bg-green-500/20 text-green-400 group-hover:bg-green-500/30 transition-colors">
                        <FaLink className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Shortlinks</p>
                        <p className="text-white text-xl font-bold">{user.stats.shortlinksCount}</p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Total Views */}
                  <Card className="bg-gray-800/40 border-gray-700 overflow-hidden group hover:bg-gray-800/60 transition-colors">
                    <CardContent className="p-4 flex items-center space-x-4">
                      <div className="p-3 rounded-full bg-amber-500/20 text-amber-400 group-hover:bg-amber-500/30 transition-colors">
                        <FaEye className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Total Views</p>
                        <p className="text-white text-xl font-bold">{user.stats.totalViews.toLocaleString()}</p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* API Keys */}
                  <Card className="bg-gray-800/40 border-gray-700 overflow-hidden group hover:bg-gray-800/60 transition-colors">
                    <CardContent className="p-4 flex items-center space-x-4">
                      <div className="p-3 rounded-full bg-red-500/20 text-red-400 group-hover:bg-red-500/30 transition-colors">
                        <FaKey className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">API Keys</p>
                        <p className="text-white text-xl font-bold">{user.stats.apiKeysCount}</p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Member Since */}
                  <Card className="bg-gray-800/40 border-gray-700 overflow-hidden group hover:bg-gray-800/60 transition-colors">
                    <CardContent className="p-4 flex items-center space-x-4">
                      <div className="p-3 rounded-full bg-teal-500/20 text-teal-400 group-hover:bg-teal-500/30 transition-colors">
                        <FaCalendar className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Member Since</p>
                        <p className="text-white text-xl font-bold">
                          {formatDistance(new Date(user.stats.memberSince), new Date(), { addSuffix: true })}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Account Status */}
                <div className="mt-6">
                  <Card className={`${user.premium ? "bg-gradient-to-r from-amber-900/40 to-amber-600/20" : "bg-gray-800/40"} border-${user.premium ? "amber-700/50" : "gray-700"}`}>
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className={`p-3 rounded-full ${user.premium ? "bg-amber-500/20 text-amber-400" : "bg-gray-700/50 text-gray-400"}`}>
                          <FaCrown className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-gray-400 text-sm">Account Status</p>
                          <p className="text-white text-xl font-bold">{user.premium ? "Premium User" : "Free User"}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
