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
import { Upload, ImageIcon, Trash2, Copy, Lock, Terminal, Search } from 'lucide-react';
import Link from 'next/link';
import { getStorageStats } from '@/lib/upload';
import { toast } from 'sonner';
import { LuMusic } from 'react-icons/lu';
import { formatFileSize } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface MediaItem {
  id: string;
  url: string;
  displayUrl: string;
  filename: string;
  createdAt: string;
  size: number;
  type: 'IMAGE' | 'VIDEO' | 'AUDIO';
  duration?: number;
  expiresAt?: string | null;
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

interface PrivateUploadItem {
  id: string;
  filename: string;
  size: number;
  contentType: string;
  oneUse: boolean;
  createdAt: string;
  webUrl: string;
  terminalUrl: string;
  curlCommand: string;
}

export function DashboardPageClient() {
  const { data: session, status } = useSession();
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('media');
  const [privateUploads, setPrivateUploads] = useState<PrivateUploadItem[]>([]);
  const [isPrivateLoading, setIsPrivateLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [paginationInfo, setPaginationInfo] = useState<PaginationInfo>({
    total: 0,
    page: 1,
    limit: 15,
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
      const params = new URLSearchParams({
        page: String(page),
        limit: String(paginationInfo.limit),
      });
      if (debouncedSearch) params.set('q', debouncedSearch);
      const response = await fetch(`/api/media?${params}`);
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

  const fetchPrivateUploads = async () => {
    setIsPrivateLoading(true);
    try {
      const response = await fetch('/api/private-upload');
      if (!response.ok) throw new Error('Failed to fetch private uploads');
      const data = await response.json();
      setPrivateUploads(data.uploads || []);
    } catch (error) {
      console.error('Failed to fetch private uploads:', error);
      setPrivateUploads([]);
      toast.error('Failed to fetch private uploads');
    } finally {
      setIsPrivateLoading(false);
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

  const copyValue = async (value: string, label: string) => {
    await navigator.clipboard.writeText(value);
    toast.success(`${label} copied`);
  };

  const handleDeletePrivateUpload = async (id: string) => {
    try {
      const response = await fetch(`/api/private-upload/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete private upload');
      setPrivateUploads((prev) => prev.filter((item) => item.id !== id));
      toast.success('Private upload deleted');
    } catch (error) {
      console.error('Failed to delete private upload:', error);
      toast.error('Failed to delete private upload');
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchMedia(currentPage);
    }
  }, [currentPage, debouncedSearch, status]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/register');
    }

    if (status === 'authenticated') {
      Promise.all([fetchMedia(), fetchPrivateUploads()]);
    }
  }, [status]);

  useEffect(() => {
    if (activeTab === 'private' && privateUploads.length === 0) {
      setActiveTab('media');
    }
  }, [activeTab, privateUploads.length]);

  if (status === 'loading') {
    return (
      <div className="container flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <main className="mx-auto w-full min-w-0 max-w-5xl px-1 py-3 sm:px-3 sm:py-5 lg:py-7">
      <Tabs value={activeTab} className="w-full" onValueChange={setActiveTab}>
        <div>
          <TabsList className="mb-5 sm:mb-6">
            <TabsTrigger value="media">My Media</TabsTrigger>
            {privateUploads.length > 0 && (
              <TabsTrigger value="private">Private Uploads</TabsTrigger>
            )}
            <TabsTrigger value="stats">Stats</TabsTrigger>
          </TabsList>
        </div>

        <div>
          <TabsContent value="media" forceMount>
            {activeTab === 'media' && (
              <>
                <div className="grid gap-4 lg:gap-5">
                  <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-xl font-semibold">Your files</h2>
                      <p className="text-muted-foreground text-sm">
                        Recently uploaded media and documents.
                      </p>
                    </div>
                    <Link href="/upload">
                      <Button className="w-full sm:w-auto">
                        <Upload className="mr-2 h-4 w-4" />
                        Upload New
                      </Button>
                    </Link>
                  </div>
                  <div className="relative">
                    <Search className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search files..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 pl-10 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>

                  {isLoading ? (
                    <div className="py-8 text-center">
                      Loading your files...
                    </div>
                  ) : mediaItems.length === 0 ? (
                    <div>
                      <Card>
                        <CardContent className="flex flex-col items-center justify-center px-4 py-12 text-center">
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
                    </div>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      {mediaItems.map((item) => (
                        <div key={item.id}>
                          <Card className="h-full overflow-hidden py-0">
                            <div className="relative aspect-[5/3] overflow-hidden bg-muted">
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
                                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-card p-4">
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
                                      <img
                                        src={item.url || '/placeholder.svg'}
                                        alt={item.filename}
                                        className="absolute inset-0 h-full w-full object-cover"
                                        loading="lazy"
                                      />
                                    );
                                }
                              })()}
                            </div>
                            <CardContent className="p-3 sm:p-4">
                              <div className="flex min-w-0 items-center justify-between gap-3">
                                <div className="min-w-0 flex-1">
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
                                    {item.type === 'VIDEO' && item.duration && (
                                      <span className="ml-2">
                                        {Math.floor(item.duration / 60)}:
                                        {(item.duration % 60)
                                          .toString()
                                          .padStart(2, '0')}
                                      </span>
                                    )}
                                    {item.expiresAt && (
                                      <span className="text-destructive ml-2">
                                        Expires{' '}
                                        {new Date(
                                          item.expiresAt
                                        ).toLocaleDateString('en-US', {
                                          month: 'short',
                                          day: '2-digit',
                                        })}
                                      </span>
                                    )}
                                  </p>
                                </div>
                                <div className="flex shrink-0 items-center gap-1">
                                  <Button
                                    variant="outline"
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
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {paginationInfo.pages > 1 && (
                  <div className="mt-6 flex justify-center">
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
                  </div>
                )}
              </>
            )}
          </TabsContent>

          {privateUploads.length > 0 && (
            <TabsContent value="private" forceMount>
              {activeTab === 'private' && (
                <div className="grid gap-4 lg:gap-5">
                  <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-xl font-semibold">Private Uploads</h2>
                      <p className="text-muted-foreground text-sm">
                        Current terminal links rotate after each successful use.
                      </p>
                    </div>
                    <Link href="/upload">
                      <Button className="w-full sm:w-auto">
                        <Upload className="mr-2 h-4 w-4" />
                        Upload New
                      </Button>
                    </Link>
                  </div>

                  <div>
                    <Card className="overflow-hidden p-0">
                      <div className="px-3 py-2 text-sm font-bold">
                        Private Uploads
                      </div>
                      <CardContent className="p-0">
                        {isPrivateLoading ? (
                          <div className="py-8 text-center">
                            Loading private uploads...
                          </div>
                        ) : (
                          <>
                            <div className="hidden xl:block">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead className="align-middle">
                                      File
                                    </TableHead>
                                    <TableHead className="align-middle">
                                      Size
                                    </TableHead>
                                    <TableHead className="align-middle">
                                      Created
                                    </TableHead>
                                    <TableHead className="align-middle">
                                      Mode
                                    </TableHead>
                                    <TableHead className="min-w-64 align-middle">
                                      Web Link
                                    </TableHead>
                                    <TableHead className="w-32 text-right align-middle">
                                      Actions
                                    </TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {privateUploads.map((item) => (
                                    <TableRow key={item.id}>
                                      <TableCell className="align-middle">
                                        <PrivateFileSummary item={item} />
                                      </TableCell>
                                      <TableCell className="align-middle">
                                        {formatFileSize(item.size)}
                                      </TableCell>
                                      <TableCell className="align-middle">
                                        {formatShortDate(item.createdAt)}
                                      </TableCell>
                                      <TableCell className="align-middle">
                                        {item.oneUse ? 'One-use' : 'Reusable'}
                                      </TableCell>
                                      <TableCell className="align-middle">
                                        <div className="grid min-w-0 max-w-xl gap-2">
                                          <DashboardLinkButton
                                            value={item.webUrl}
                                            onCopy={() =>
                                              copyValue(item.webUrl, 'Web URL')
                                            }
                                          />
                                        </div>
                                      </TableCell>
                                      <TableCell className="text-right align-middle">
                                        <div className="flex justify-end gap-2">
                                          <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={() =>
                                              copyValue(
                                                item.curlCommand,
                                                'Curl command'
                                              )
                                            }
                                            aria-label={`Copy curl command for ${item.filename}`}
                                          >
                                            <Terminal className="h-4 w-4" />
                                          </Button>
                                          <Button
                                            variant="destructive"
                                            size="icon"
                                            onClick={() =>
                                              handleDeletePrivateUpload(item.id)
                                            }
                                            aria-label={`Delete ${item.filename}`}
                                          >
                                            <Trash2 className="h-4 w-4" />
                                          </Button>
                                        </div>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>

                            <div className="grid gap-3 p-3 xl:hidden">
                              {privateUploads.map((item) => (
                                <div
                                  key={item.id}
                                  className="rounded-lg border bg-card p-3 shadow-sm"
                                >
                                  <div className="mb-3 flex min-w-0 items-start justify-between gap-3">
                                    <PrivateFileSummary item={item} />
                                  </div>
                                  <div className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                                    <span>{formatFileSize(item.size)}</span>
                                    <span>
                                      {formatShortDate(item.createdAt)}
                                    </span>
                                    <span>
                                      {item.oneUse ? 'One-use' : 'Reusable'}
                                    </span>
                                  </div>
                                  <div className="grid gap-2">
                                    <DashboardLinkButton
                                      value={item.webUrl}
                                      onCopy={() =>
                                        copyValue(item.webUrl, 'Web URL')
                                      }
                                    />
                                    <div className="grid grid-cols-2 gap-2">
                                      <Button
                                        variant="outline"
                                        className="w-full"
                                        onClick={() =>
                                          copyValue(
                                            item.curlCommand,
                                            'Curl command'
                                          )
                                        }
                                      >
                                        <Terminal className="h-4 w-4" />
                                        Curl
                                      </Button>
                                      <Button
                                        variant="destructive"
                                        className="w-full"
                                        onClick={() =>
                                          handleDeletePrivateUpload(item.id)
                                        }
                                      >
                                        <Trash2 className="h-4 w-4" />
                                        Delete
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </TabsContent>
          )}

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
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {statsData.map((stat) => (
                        <div key={stat.title}>
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
                              <div className="text-primary text-3xl font-bold">
                                {stat.prefix}
                                {stat.value}
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </>
            )}
          </TabsContent>
        </div>
      </Tabs>
    </main>
  );
}

function formatShortDate(value: string) {
  return new Date(value).toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
}

function PrivateFileSummary({ item }: { item: PrivateUploadItem }) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <span className="rounded-lg border bg-secondary p-1.5">
        <Lock className="h-4 w-4 shrink-0" />
      </span>
      <div className="min-w-0">
        <p className="truncate font-medium">{item.filename}</p>
        <p className="text-muted-foreground truncate text-xs">
          {item.contentType}
        </p>
      </div>
    </div>
  );
}

function DashboardLinkButton({
  value,
  onCopy,
}: {
  value: string;
  onCopy: () => void;
}) {
  return (
    <div className="grid min-w-0 gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
      <code className="min-w-0 overflow-hidden border bg-muted px-2 py-1 text-xs leading-7 text-ellipsis">
        {value}
      </code>
      <Button
        type="button"
        variant="outline"
        className="w-full sm:w-auto"
        onClick={onCopy}
      >
        <Copy className="h-4 w-4" />
        Copy
      </Button>
    </div>
  );
}
