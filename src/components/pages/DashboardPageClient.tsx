'use client';

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Upload, ImageIcon, Trash2, Copy } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { getStorageStats } from '@/lib/upload';
import { toast } from 'sonner';
import { LuMusic } from 'react-icons/lu';
import { formatFileSize } from '@/lib/utils';

interface MediaItem {
  id: string;
  url: string;
  displayUrl: string;
  filename: string;
  createdAt: string;
  size: number;
  type: 'IMAGE' | 'VIDEO' | 'AUDIO';
  duration?: number;
}

interface Stats {
  totalUploads: number;
  storageUsed: number;
  apiRequests: number;
  uid: number;
  createdAt?: string | null;
  memberSince?: string;
  accountType?: string;
}

interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  pages: number;
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

export function DashboardPageClient() {
  const { data: session, status } = useSession();
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('media');
  const [currentPage, setCurrentPage] = useState(1);
  const [paginationInfo, setPaginationInfo] = useState<PaginationInfo>({
    total: 0,
    page: 1,
    limit: 20,
    pages: 1,
  });
  const [stats, setStats] = useState<Stats>({
    totalUploads: 0,
    storageUsed: 0,
    apiRequests: 0,
    uid: 0,
  });

  const fetchMedia = async (page: number = 1) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/media?page=${page}&limit=20`);
      if (!response.ok) throw new Error('Failed to fetch media');
      const data = await response.json();
      setMediaItems(data.media || []);
      setStats(data.stats);
      setPaginationInfo(data.pagination);
    } catch (error) {
      console.error('Failed to fetch media:', error);
      setMediaItems([]);
      toast.error('Failed to fetch media');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteMedia = async (id: string) => {
    try {
      const response = await fetch(`/api/media/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete media');

      setMediaItems((prev) => prev.filter((item) => item.id !== id));
      setStats((prev) => ({
        ...prev,
        totalUploads: prev.totalUploads - 1,
        storageUsed:
          prev.storageUsed -
          (mediaItems.find((item) => item.id === id)?.size || 0),
      }));

      toast.success('Media deleted successfully');
    } catch (error) {
      console.error('Failed to delete media:', error);
      toast.error('Failed to delete media');
    }
  };

  const handleCopyUrl = (imageId: string) => {
    const image = mediaItems.find((img) => img.id === imageId);
    if (image) {
      navigator.clipboard.writeText(image.displayUrl);
      toast.success('Image URL copied to clipboard');
    }
  };

  useEffect(() => {
    if (status === 'authenticated') {
      fetchMedia(currentPage);
    }
  }, [currentPage, status]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/register');
    }

    if (status === 'authenticated') {
      Promise.resolve([fetchMedia()]);
    }
  }, [status]);

  if (status === 'loading') {
    return (
      <motion.div
        className="container flex min-h-[calc(100vh-4rem)] items-center justify-center"
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
      className="max-w-8xl container mx-auto py-8 sm:py-12 lg:py-16 xl:py-20"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.h1
        className="mb-6 text-3xl font-bold lg:mb-8 lg:text-4xl xl:text-5xl"
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
              {activeTab === 'media' && (
                <>
                  <motion.div
                    className="grid gap-6 lg:gap-8"
                    variants={staggerContainer}
                  >
                    <motion.div
                      className="flex items-center justify-between"
                      variants={fadeIn}
                    >
                      <h2 className="text-xl font-semibold">Your Files</h2>
                      <Link href="/upload">
                        <Button>
                          <Upload className="mr-2 h-4 w-4" />
                          Upload New
                        </Button>
                      </Link>
                    </motion.div>

                    {isLoading ? (
                      <motion.div
                        className="py-8 text-center"
                        variants={fadeIn}
                      >
                        Loading your files...
                      </motion.div>
                    ) : mediaItems.length === 0 ? (
                      <motion.div variants={fadeIn}>
                        <Card>
                          <CardContent className="flex flex-col items-center justify-center py-12">
                            <ImageIcon className="text-muted-foreground mb-4 h-12 w-12" />
                            <p className="text-muted-foreground mb-4">
                              You haven&apos;t uploaded any files yet
                            </p>
                            <Link href="/upload">
                              <Button>
                                <Upload className="mr-2 h-4 w-4" />
                                Upload Your First File
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
                          <motion.div
                            key={item.id}
                            variants={fadeIn}
                            layoutId={item.id}
                          >
                            <Card className="h-full">
                              <div className="relative aspect-square overflow-hidden">
                                {(() => {
                                  switch (item.type) {
                                    case 'VIDEO':
                                      return (
                                        <video
                                          src={item.url}
                                          controls
                                          className="absolute inset-0 h-full w-full object-cover"
                                        />
                                      );
                                    case 'AUDIO':
                                      return (
                                        <div className="bg-muted/20 absolute inset-0 flex flex-col items-center justify-center p-4">
                                          <LuMusic className="text-muted-foreground mb-4 h-16 w-16" />
                                          <audio controls className="w-full">
                                            <source
                                              src={item.url}
                                              type="audio/mpeg"
                                            />
                                          </audio>
                                        </div>
                                      );
                                    default:
                                      return (
                                        <Image
                                          src={item.url || '/placeholder.svg'}
                                          alt={item.filename}
                                          fill
                                          className="object-cover"
                                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                        />
                                      );
                                  }
                                })()}
                              </div>
                              <CardContent className="p-4 lg:p-6">
                                <div className="flex items-center justify-between">
                                  <div className="mr-2 truncate">
                                    <p className="truncate font-medium">
                                      {item.filename}
                                    </p>
                                    <p className="text-muted-foreground text-xs">
                                      {new Date(
                                        item.createdAt
                                      ).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: '2-digit',
                                      })}
                                      {item.type === 'VIDEO' &&
                                        item.duration && (
                                          <span className="ml-2">
                                            {Math.floor(item.duration / 60)}:
                                            {(item.duration % 60)
                                              .toString()
                                              .padStart(2, '0')}
                                          </span>
                                        )}
                                    </p>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Button
                                      size="icon"
                                      onClick={() => handleCopyUrl(item.id)}
                                    >
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
                  {mediaItems.length > 0 && (
                    <motion.div
                      variants={fadeIn}
                      className="mt-6 flex justify-center"
                    >
                      <Pagination>
                        <PaginationContent>
                          <PaginationItem>
                            {currentPage > 1 && (
                              <PaginationPrevious
                                onClick={() =>
                                  setCurrentPage((p) => Math.max(1, p - 1))
                                }
                              />
                            )}
                          </PaginationItem>

                          {[...Array(paginationInfo.pages)].map((_, i) => {
                            const pageNumber = i + 1;
                            if (
                              pageNumber === 1 ||
                              pageNumber === paginationInfo.pages ||
                              (pageNumber >= currentPage - 1 &&
                                pageNumber <= currentPage + 1)
                            ) {
                              return (
                                <PaginationItem key={pageNumber}>
                                  <PaginationLink
                                    onClick={() => setCurrentPage(pageNumber)}
                                    isActive={currentPage === pageNumber}
                                  >
                                    {pageNumber}
                                  </PaginationLink>
                                </PaginationItem>
                              );
                            } else if (
                              pageNumber === currentPage - 2 ||
                              pageNumber === currentPage + 2
                            ) {
                              return (
                                <PaginationItem key={pageNumber}>
                                  <PaginationEllipsis />
                                </PaginationItem>
                              );
                            }
                            return null;
                          })}

                          <PaginationItem>
                            {currentPage < paginationInfo.pages && (
                              <PaginationNext
                                onClick={() =>
                                  setCurrentPage((p) =>
                                    Math.min(paginationInfo.pages, p + 1)
                                  )
                                }
                              />
                            )}
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    </motion.div>
                  )}
                </>
              )}
            </TabsContent>

            <TabsContent value="stats" forceMount>
              {activeTab === 'stats' && (
                <>
                  {(() => {
                    const storageStats = getStorageStats(
                      stats.storageUsed,
                      session?.user?.premium ?? false,
                      session?.user?.admin ?? false
                    );
                    const statsData = [
                      {
                        title: 'Total Uploads',
                        description: "Number of files you've uploaded",
                        value: stats.totalUploads,
                      },
                      {
                        title: 'Storage Used',
                        description: session?.user?.premium
                          ? 'Unlimited storage available'
                          : `${storageStats.used} of ${storageStats.total} used`,
                        value: session?.user?.premium
                          ? formatFileSize(stats.storageUsed)
                          : storageStats.percentage,
                      },
                      {
                        title: 'API Requests',
                        description: 'API requests in the last 30 days',
                        value: stats.apiRequests,
                      },
                      {
                        title: 'UID',
                        description: 'Your user ID',
                        value: stats.uid || 'N/A',
                        prefix: '#',
                      },
                      {
                        title: 'Account Type',
                        description: 'Your current subscription tier',
                        value: session?.user?.premium ? 'Premium' : 'Free',
                      },
                      {
                        title: 'Member Since',
                        description: 'Account creation date',
                        value: stats.createdAt
                          ? new Date(stats.createdAt).toLocaleDateString(
                              'en-GB',
                              {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              }
                            )
                          : 'N/A',
                      },
                    ];
                    return (
                      <motion.div
                        className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
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
                                  className="text-primary text-3xl font-bold"
                                  initial={{ scale: 0.5, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  transition={{ delay: index * 0.1 }}
                                >
                                  {stat.prefix}
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
