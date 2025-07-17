import { Metadata } from 'next';
import { MediaActions } from '@/components/Files/MediaActions';
import { ArchivePreview } from '@/components/Archive/ArchivePreview';
import Image from 'next/image';
import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { betaMembers } from '@/lib/beta';
import { Viewport } from 'next';
import { LuMusic } from 'react-icons/lu';
import { File, FileText, Archive } from 'lucide-react';
import { HideNavbar } from '@/components/Layout/HideNavbar';

interface Props {
  params: Promise<{ id?: string[] }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
    hour12: false,
  }).format(date);
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const { id } = params;
  const mediaId = id?.[0];

  if (!mediaId) {
    return {
      title: 'Media not found',
      description: 'The requested media could not be found.',
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
      title: 'Media not found',
      description: 'The requested media could not be found.',
    };
  }

  const premiumTheme = media.user?.premium
    ? {
        creator: media.user.name,
        applicationName: 'AnonHost Premium',
      }
    : {};

  const description = `${media.user?.premium ? '⭐ ' : ''}Uploaded by ${
    media.user?.name || 'Anonymous'
  }\n📁 ${formatBytes(media.size)}\n📅 ${formatDate(media.createdAt)}`;

  const dimensions = {
    width: typeof media.width === 'number' ? media.width : 1280,
    height: typeof media.height === 'number' ? media.height : 720,
  };

  if (media.type === 'VIDEO') {
    return {
      title: media.filename || 'Untitled',
      description,
      ...premiumTheme,
      openGraph: {
        title: media.filename || 'Untitled',
        description,
        type: 'video.other',
        url: media.url,
        siteName: media.user?.premium ? 'AnonHost Premium' : 'AnonHost',
        videos: [
          {
            url: media.url,
            width: dimensions.width,
            height: dimensions.height,
            type: 'video/mp4',
          },
        ],
        images: [
          {
            url: `${media.url}?thumb=1`,
            width: dimensions.width,
            height: dimensions.height,
            alt: media.filename || 'Video thumbnail',
          },
        ],
      },
      twitter: {
        card: 'player',
        title: media.filename || 'Untitled',
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
    title: media.filename || 'Untitled',
    description,
    ...premiumTheme,
    openGraph: {
      title: `${media.filename || 'Untitled'}`,
      description,
      type: 'website',
      url: media.url,
      siteName: media.user?.premium ? 'AnonHost Premium' : 'AnonHost',
      ...(media.type === 'IMAGE' && {
        images: [
          {
            url: media.url,
            width: dimensions.width,
            height: dimensions.height,
            alt: media.filename || 'Image',
          },
        ],
      }),
    },
    twitter: {
      card: media.type === 'IMAGE' ? 'summary_large_image' : 'summary',
      title: `${media.user?.premium ? '⭐ ' : ''}${media.filename || 'Untitled'}`,
      description,
      ...(media.type === 'IMAGE' && { images: [media.url] }),
      creator: media.user?.premium ? (media.user.name ?? undefined) : undefined,
    },
  };
}

export async function generateViewport(props: Props): Promise<Viewport> {
  const params = await props.params;
  const { id } = params;
  const mediaId = id?.[0];

  if (!mediaId) {
    return {
      width: 'device-width',
      initialScale: 1,
      maximumScale: 1,
      userScalable: false,
    };
  }

  const media = await prisma.media.findUnique({
    where: { id: mediaId },
    include: {
      user: {
        select: {
          id: true,
          premium: true,
        },
      },
    },
  });

  if (!media?.user?.premium) {
    return {
      width: 'device-width',
      initialScale: 1,
      maximumScale: 1,
      userScalable: false,
    };
  }

  return {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    themeColor: '#a855f7',
  };
}

export default async function MediaPage(props: Props) {
  const params = await props.params;
  const { id } = params;
  const mediaId = id?.[0];

  if (!mediaId) {
    notFound();
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
  }

  return (
    <div className="container py-8">
      <HideNavbar />
      <Card className="mx-auto max-w-4xl">
        <div className="relative aspect-video">
          {(() => {
            switch ((media as any).type) {
              case 'VIDEO':
                return (
                  <video
                    src={media.url}
                    controls
                    className="h-full w-full"
                    autoPlay
                    playsInline
                  />
                );
              case 'AUDIO':
                return (
                  <div className="bg-muted/20 flex h-full w-full flex-col items-center justify-center gap-4">
                    <LuMusic className="text-muted-foreground h-24 w-24" />
                    <audio controls className="w-3/4 max-w-xl">
                      <source src={media.url} type="audio/mpeg" />
                      Your browser does not support the audio element.
                    </audio>
                  </div>
                );
              case 'TEXT':
                return (
                  <div className="flex h-full w-full items-center justify-center">
                    <FileText className="text-muted-foreground h-24 w-24" />
                  </div>
                );
              case 'DOCUMENT':
                return (
                  <div className="flex h-full w-full items-center justify-center">
                    <File className="text-muted-foreground h-24 w-24" />
                  </div>
                );
              case 'ARCHIVE':
                return (
                  <div className="flex h-full w-full items-center justify-center">
                    <Archive className="text-muted-foreground h-24 w-24" />
                  </div>
                );
              case 'IMAGE':
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
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h1 className="text-foreground text-2xl font-semibold">
                {media.filename}
              </h1>
              {media.user?.premium && (
                <span className="rounded-full bg-gradient-to-r from-purple-500 to-pink-500 px-2 py-1 text-xs font-medium text-white">
                  Premium
                </span>
              )}
              {media.user?.id && betaMembers.includes(media.user.id) && (
                <span className="rounded-full bg-gradient-to-r from-blue-500 to-blue-600 px-2 py-1 text-xs font-medium text-white">
                  Beta
                </span>
              )}
            </div>
            <MediaActions url={media.url} filename={media.filename} />
          </div>

          <div className="grid grid-cols-4 gap-6">
            <Card>
              <CardHeader className="p-4">
                <h3 className="text-foreground text-sm font-medium">
                  Uploader
                </h3>
                <p className="text-muted-foreground text-sm font-semibold">
                  {media.user?.name || 'Anonymous'}
                </p>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="p-4">
                <h3 className="text-foreground text-sm font-medium">Type</h3>
                <p className="text-muted-foreground text-sm font-semibold">
                  {media.type}
                </p>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="p-4">
                <h3 className="text-foreground text-sm font-medium">Size</h3>
                <p className="text-muted-foreground text-sm font-semibold">
                  {formatBytes(media.size)}
                </p>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="p-4">
                <h3 className="text-foreground text-sm font-medium">
                  Uploaded
                </h3>
                <p className="text-muted-foreground text-sm font-semibold">
                  {formatDate(media.createdAt)}
                </p>
              </CardHeader>
            </Card>
          </div>

          {media.type === 'VIDEO' && media.duration && (
            <Card className="mt-6">
              <CardHeader className="p-4">
                <h3 className="text-foreground text-sm font-medium">
                  Duration
                </h3>
                <p className="text-muted-foreground text-sm font-semibold">
                  {Math.floor(media.duration / 60)}:
                  {(media.duration % 60).toString().padStart(2, '0')}
                </p>
              </CardHeader>
            </Card>
          )}

          {(media as any).type === 'ARCHIVE' && (media as any).archiveMeta && (
            <div className="mt-6">
              <ArchivePreview
                metadata={(media as any).archiveMeta}
                filename={media.filename}
                downloadUrl={media.url}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
