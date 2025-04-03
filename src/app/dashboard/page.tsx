"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Upload, ImageIcon, Trash2, Copy } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { getStorageStats } from "@/lib/upload";
import { toast } from "@/hooks/use-toast";

interface MediaItem {
  id: string;
  url: string;
  displayUrl: string;
  filename: string;
  createdAt: string;
  size: number;
  type: 'IMAGE' | 'VIDEO';
  duration?: number;
}

interface Stats {
  totalUploads: number;
  storageUsed: number;
  apiRequests: number;
}

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

const slideAnimation = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 },
};

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("media");
  const [stats, setStats] = useState<Stats>({
    totalUploads: 0,
    storageUsed: 0,
    apiRequests: 0,
  });

  const fetchMedia = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/media");
      if (!response.ok) throw new Error("Failed to fetch media");
      const data = await response.json();
      setMediaItems(data.media || []);
      setStats(data.stats);
    } catch (error) {
      console.error("Failed to fetch media:", error);
      setMediaItems([]);
      toast({
        title: "Error",
        description: "Failed to fetch media",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteMedia = async (id: string) => {
    try {
      const response = await fetch(`/api/media/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete media");

      setMediaItems((prev) => prev.filter((item) => item.id !== id));
      setStats((prev) => ({
        ...prev,
        totalUploads: prev.totalUploads - 1,
        storageUsed:
          prev.storageUsed - (mediaItems.find((item) => item.id === id)?.size || 0),
      }));

      toast({
        title: "Success",
        description: "Media deleted successfully",
      });
    } catch (error) {
      console.error("Failed to delete media:", error);
      toast({
        title: "Error",
        description: "Failed to delete media",
        variant: "destructive",
      });
    }
  };

  const handleCopyUrl = (imageId: string) => {
    const image = mediaItems.find((img) => img.id === imageId);
    if (image) {
      navigator.clipboard.writeText(image.displayUrl);
      toast({
        title: "Copied",
        description: "Image URL copied to clipboard",
      });
    }
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      redirect("/register");
    }

    if (status === "authenticated") {
      Promise.all([fetchMedia()]);
    }
  }, [status]);

  if (status === "loading") {
    return (
      <motion.div
        className="container flex items-center justify-center min-h-[calc(100vh-4rem)]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="text-center">Loading...</div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="container max-w-8xl mx-auto py-8 sm:py-12 lg:py-16 xl:py-20"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.h1
        className="text-3xl lg:text-4xl xl:text-5xl font-bold mb-6 lg:mb-8"
        variants={fadeIn}
        initial="initial"
        animate="animate"
      >
        Dashboard
      </motion.h1>

      <Tabs
        defaultValue="media"
        className="w-full"
        onValueChange={setActiveTab}
      >
        <motion.div variants={fadeIn} initial="initial" animate="animate">
          <TabsList className="mb-4">
            <TabsTrigger value="media">My Media</TabsTrigger>
            <TabsTrigger value="stats">Stats</TabsTrigger>
          </TabsList>
        </motion.div>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={activeTab}
            variants={slideAnimation}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.2 }}
          >
            <TabsContent value="media" forceMount>
              {activeTab === "media" && (
                <motion.div
                  className="grid gap-6 lg:gap-8"
                  variants={staggerContainer}
                >
                  <motion.div
                    className="flex justify-between items-center"
                    variants={fadeIn}
                  >
                    <h2 className="text-xl font-semibold">Your Media</h2>
                    <Link href="/upload">
                      <Button>
                        <Upload className="mr-2 h-4 w-4" />
                        Upload New
                      </Button>
                    </Link>
                  </motion.div>

                  {isLoading ? (
                    <motion.div className="text-center py-8" variants={fadeIn}>
                      Loading your media...
                    </motion.div>
                  ) : mediaItems.length === 0 ? (
                    <motion.div variants={fadeIn}>
                      <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                          <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
                          <p className="text-muted-foreground mb-4">
                            You haven't uploaded any media yet
                          </p>
                          <Link href="/upload">
                            <Button>
                              <Upload className="mr-2 h-4 w-4" />
                              Upload Your First Media
                            </Button>
                          </Link>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ) : (
                    <motion.div
                      className="grid gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
                      variants={staggerContainer}
                    >
                      {mediaItems.map((item) => (
                        <motion.div key={item.id} variants={fadeIn} layoutId={item.id}>
                          <Card className="h-full">
                            <div className="aspect-square relative overflow-hidden">
                              {item.type === 'VIDEO' ? (
                                <video
                                  src={item.url}
                                  controls
                                  className="absolute inset-0 w-full h-full object-cover"
                                />
                              ) : (
                                <Image
                                  src={item.url || "/placeholder.svg"}
                                  alt={item.filename}
                                  fill
                                  className="object-cover"
                                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                />
                              )}
                            </div>
                            <CardContent className="p-4 lg:p-6">
                              <div className="flex justify-between items-center">
                                <div className="truncate mr-2">
                                  <p className="font-medium truncate">{item.filename}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {new Date(item.createdAt).toLocaleDateString('en-US', {
                                      year: 'numeric',
                                      month: 'long',
                                      day: '2-digit'
                                    })}
                                    {item.type === 'VIDEO' && item.duration && (
                                      <span className="ml-2">
                                        {Math.floor(item.duration / 60)}:{(item.duration % 60).toString().padStart(2, '0')}
                                      </span>
                                    )}
                                  </p>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Button size="icon" onClick={() => handleCopyUrl(item.id)}>
                                    <Copy className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    size="icon"
                                    onClick={() => handleDeleteMedia(item.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </motion.div>
              )}
            </TabsContent>

            <TabsContent value="stats" forceMount>
              {activeTab === "stats" && (
                <>
                  {(() => {
                    const storageStats = getStorageStats(
                      stats.storageUsed,
                      session?.user?.premium ?? false,
                    );
                    const statsData = [
                      {
                        title: "Total Uploads",
                        description: "Number of images you've uploaded",
                        value: stats.totalUploads,
                      },
                      {
                        title: "Storage Used",
                        description: `${storageStats.used} of ${storageStats.total}`,
                        value: storageStats.percentage,
                      },
                      {
                        title: "API Requests",
                        description: "API requests in the last 30 days",
                        value: stats.apiRequests,
                      },
                    ];
                    return (
                      <motion.div
                        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6"
                        variants={staggerContainer}
                        initial="initial"
                        animate="animate"
                      >
                        {statsData.map((stat, index) => (
                          <motion.div key={stat.title} variants={fadeIn}>
                            <Card className="h-full">
                              <CardHeader>
                                <CardTitle className="text-xl">
                                  {stat.title}
                                </CardTitle>
                                <CardDescription className="text-sm">
                                  {stat.description}
                                </CardDescription>
                              </CardHeader>
                              <CardContent>
                                <motion.div
                                  className="text-3xl font-bold text-primary"
                                  initial={{ scale: 0.5, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  transition={{ delay: index * 0.1 }}
                                >
                                  {stat.value}
                                </motion.div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        ))}
                      </motion.div>
                    );
                  })()}
                </>
              )}
            </TabsContent>
          </motion.div>
        </AnimatePresence>
      </Tabs>
    </motion.div>
  );
}
