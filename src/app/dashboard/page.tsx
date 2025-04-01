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
import { toast } from "@/components/ui/use-toast";

interface ImageData {
  id: string;
  url: string;
  displayUrl: string;
  filename: string;
  createdAt: string;
  size: number;
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

const cardHover = {
  scale: 1.02,
  transition: { duration: 0.2 },
};

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [images, setImages] = useState<ImageData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("images");
  const [stats, setStats] = useState<Stats>({
    totalUploads: 0,
    storageUsed: 0,
    apiRequests: 0,
  });

  const fetchImages = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/images");
      if (!response.ok) throw new Error("Failed to fetch images");
      const data = await response.json();
      setImages(data.images || []);
      setStats(data.stats);
    } catch (error) {
      console.error("Failed to fetch images:", error);
      setImages([]);
      toast({
        title: "Error",
        description: "Failed to fetch images",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteImage = async (id: string) => {
    try {
      const response = await fetch(`/api/images/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete image");

      setImages((prev) => prev.filter((image) => image.id !== id));
      setStats((prev) => ({
        ...prev,
        totalUploads: prev.totalUploads - 1,
        storageUsed:
          prev.storageUsed - (images.find((img) => img.id === id)?.size || 0),
      }));

      toast({
        title: "Success",
        description: "Image deleted successfully",
      });
    } catch (error) {
      console.error("Failed to delete image:", error);
      toast({
        title: "Error",
        description: "Failed to delete image",
        variant: "destructive",
      });
    }
  };

  const handleCopyUrl = (imageId: string) => {
    const image = images.find((img) => img.id === imageId);
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
      redirect("/");
    }

    if (status === "authenticated") {
      Promise.all([fetchImages()]);
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
      className="container py-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.h1
        className="text-3xl font-bold mb-6"
        variants={fadeIn}
        initial="initial"
        animate="animate"
      >
        Dashboard
      </motion.h1>

      <Tabs
        defaultValue="images"
        className="w-full"
        onValueChange={setActiveTab}
      >
        <motion.div variants={fadeIn} initial="initial" animate="animate">
          <TabsList className="mb-4">
            <TabsTrigger value="images">My Images</TabsTrigger>
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
            <TabsContent value="images" forceMount>
              {activeTab === "images" && (
                <motion.div className="grid gap-6" variants={staggerContainer}>
                  <motion.div
                    className="flex justify-between items-center"
                    variants={fadeIn}
                  >
                    <h2 className="text-xl font-semibold">Your Images</h2>
                    <Link href="/upload">
                      <Button>
                        <Upload className="mr-2 h-4 w-4" />
                        Upload New
                      </Button>
                    </Link>
                  </motion.div>

                  {isLoading ? (
                    <motion.div className="text-center py-8" variants={fadeIn}>
                      Loading your images...
                    </motion.div>
                  ) : images.length === 0 ? (
                    <motion.div variants={fadeIn}>
                      <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                          <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
                          <p className="text-muted-foreground mb-4">
                            You haven&apos;t uploaded any images yet
                          </p>
                          <Link href="/upload">
                            <Button>
                              <Upload className="mr-2 h-4 w-4" />
                              Upload Your First Image
                            </Button>
                          </Link>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ) : (
                    <motion.div
                      className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
                      variants={staggerContainer}
                      initial="initial"
                      animate="animate"
                    >
                      {images.map((image) => (
                        <motion.div
                          key={image.id}
                          variants={fadeIn}
                          layoutId={image.id}
                          whileHover={cardHover}
                        >
                          <Card>
                            <div className="aspect-square relative overflow-hidden">
                              <Image
                                src={image.url || "/placeholder.svg"}
                                alt={image.filename}
                                fill
                                className="object-cover"
                              />
                            </div>
                            <CardContent className="p-4">
                              <div className="flex justify-between items-center">
                                <div className="truncate mr-2">
                                  <p className="font-medium truncate">
                                    {image.filename}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {new Date(
                                      image.createdAt,
                                    ).toLocaleDateString()}
                                  </p>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Button
                                    size="icon"
                                    onClick={() => handleCopyUrl(image.id)}
                                  >
                                    <Copy className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    size="icon"
                                    onClick={() => handleDeleteImage(image.id)}
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
                    const storageStats = getStorageStats(stats.storageUsed, session?.user?.premium ?? false);
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
                        className="grid gap-6 md:grid-cols-3"
                        variants={staggerContainer}
                        initial="initial"
                        animate="animate"
                      >
                        {statsData.map((stat, index) => (
                          <motion.div key={stat.title} variants={fadeIn}>
                            <Card>
                              <CardHeader className="pb-2">
                                <CardTitle>{stat.title}</CardTitle>
                                <CardDescription>
                                  {stat.description}
                                </CardDescription>
                              </CardHeader>
                              <CardContent>
                                <motion.div
                                  className="text-3xl font-bold"
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
