import { Metadata } from "next";
import { MediaActions } from "@/components/Files/MediaActions";
import { ArchivePreview } from "@/components/Archive/ArchivePreview";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { betaMembers } from "@/lib/beta";
import { Viewport } from "next";
import { LuMusic } from "react-icons/lu";
import { Archive, Calendar, File, FileText, HardDrive, User } from "lucide-react";
import { HideNavbar } from "@/components/Layout/HideNavbar";

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

function applyTemplate(template: string, context: Record<string, string | number>): string {
  return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key) => {
    const value = context[key];
    return value === undefined || value === null ? "" : String(value);
  });
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
          settings: {
            select: {
              disableEmbedByDefault: true,
              embedTitleTemplate: true,
              embedDescriptionTemplate: true,
              embedSiteName: true,
            },
          },
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

  const context = {
    filename: media.filename || "Untitled",
    uploader: media.user?.name || "Anonymous",
    size: formatBytes(media.size),
    uploadedAt: formatDate(media.createdAt),
  };

  const embedTitle =
    applyTemplate(media.user?.settings?.embedTitleTemplate || "{{filename}}", context).trim() ||
    media.filename ||
    "Untitled";
  const description =
    applyTemplate(
      media.user?.settings?.embedDescriptionTemplate ||
        "Uploaded by {{uploader}}\nSize: {{size}}\nUploaded: {{uploadedAt}}",
      context,
    ).trim() || `Uploaded by ${context.uploader}`;
  const embedSiteName = media.user?.settings?.embedSiteName || "AnonHost";

  const dimensions = {
    width: typeof media.width === "number" ? media.width : 1280,
    height: typeof media.height === "number" ? media.height : 720,
  };

  if ((media as any).disableEmbed || media.user?.settings?.disableEmbedByDefault) {
    return {
      title: embedTitle,
      description,
      openGraph: {
        title: embedTitle,
        description,
        type: "website",
        url: media.url,
        siteName: embedSiteName,
        ...(media.type === "IMAGE" && {
          images: [
            {
              url: media.url,
              width: dimensions.width,
              height: dimensions.height,
              alt: media.filename || "Image",
            },
          ],
        }),
      },
      twitter: {
        card: media.type === "IMAGE" ? "summary_large_image" : "summary",
        title: embedTitle,
        description,
        ...(media.type === "IMAGE" && { images: [media.url] }),
      },
      alternates: {
        canonical: media.url,
      },
    };
  }

  if (media.type === "VIDEO") {
    return {
      title: embedTitle,
      description,
      openGraph: {
        title: embedTitle,
        description,
        type: "video.other",
        url: media.url,
        siteName: embedSiteName,
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
        title: embedTitle,
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
    title: embedTitle,
    description,
    openGraph: {
      title: embedTitle,
      description,
      type: "website",
      url: media.url,
      siteName: embedSiteName,
      ...(media.type === "IMAGE" && {
        images: [
          {
            url: media.url,
            width: dimensions.width,
            height: dimensions.height,
            alt: media.filename || "Image",
          },
        ],
      }),
    },
    twitter: {
      card: media.type === "IMAGE" ? "summary_large_image" : "summary",
      title: embedTitle,
      description,
      ...(media.type === "IMAGE" && { images: [media.url] }),
      creator: media.user.name ?? undefined,
    },
  };
}

export async function generateViewport(props: Props): Promise<Viewport> {
  const params = await props.params;
  const { id } = params;
  const mediaId = id?.[0];

  if (!mediaId) {
    return {
      width: "device-width",
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
          settings: {
            select: {
              disableEmbedByDefault: true,
            },
          },
        },
      },
    },
  });

  if ((media as any)?.disableEmbed || media?.user?.settings?.disableEmbedByDefault) {
    return {
      width: "device-width",
      initialScale: 1,
      maximumScale: 1,
      userScalable: false,
      themeColor: "#000000",
    };
  }

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
  }

  const media = await prisma.media.findUnique({
    where: { id: mediaId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!media) {
    notFound();
  }

  const hasArchiveTreePreview =
    (media as any).type === "ARCHIVE" && Boolean((media as any).archiveMeta);

  if (hasArchiveTreePreview) {
    return (
      <div className="container flex min-h-[calc(100vh-4rem)] items-center py-8 md:py-10">
        <HideNavbar />
        <ArchivePreview
          metadata={(media as any).archiveMeta}
          filename={media.filename}
          downloadUrl={media.url}
          uploader={media.user?.name || "Anonymous"}
          uploadedAt={media.createdAt}
          fileId={media.id}
          fileSize={media.size}
        />
      </div>
    );
  }

  return (
    <div className="container flex min-h-[calc(100vh-4rem)] items-center py-8 md:py-10">
      <HideNavbar />
      <Card className="bg-card mx-auto w-full max-w-5xl overflow-hidden border shadow-2xl">
        <>
          <div className="relative flex aspect-video items-center justify-center border-b leading-none">
            {(() => {
              switch ((media as any).type) {
                case "VIDEO":
                  return (
                    <video
                      src={media.url}
                      controls
                      className="h-full w-full"
                      autoPlay
                      playsInline
                    />
                  );
                case "AUDIO":
                  return (
                    <div className="flex h-full w-full flex-col items-center justify-center gap-4 p-6">
                      <LuMusic className="text-muted-foreground h-20 w-20" />
                      <audio controls className="w-full max-w-2xl">
                        <source src={media.url} type="audio/mpeg" />
                        Your browser does not support the audio element.
                      </audio>
                    </div>
                  );
                case "TEXT":
                  return (
                    <div className="flex h-full w-full items-center justify-center">
                      <FileText className="text-muted-foreground h-20 w-20" />
                    </div>
                  );
                case "DOCUMENT":
                  return (
                    <div className="flex h-full w-full items-center justify-center">
                      <File className="text-muted-foreground h-20 w-20" />
                    </div>
                  );
                case "ARCHIVE":
                  return (
                    <div className="flex h-full w-full items-center justify-center">
                      <Archive className="text-muted-foreground h-20 w-20" />
                    </div>
                  );
                case "IMAGE":
                default:
                  return (
                    <img
                      src={media.url}
                      alt={media.filename}
                      className="block h-full w-full object-contain align-middle"
                      loading="eager"
                    />
                  );
              }
            })()}
          </div>

          <CardContent className="space-y-4 p-4 sm:p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-2">
                <h1 className="text-foreground text-2xl font-semibold break-all sm:text-3xl">
                  {media.filename}
                </h1>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="bg-muted text-muted-foreground rounded-full border px-2.5 py-1">
                    {media.type}
                  </span>
                  {media.user?.id && betaMembers.includes(media.user.id) && (
                    <span className="rounded-full border border-blue-500/40 bg-blue-500/15 px-2.5 py-1 font-medium text-blue-300">
                      Beta
                    </span>
                  )}
                </div>
              </div>

              <MediaActions url={media.url} filename={media.filename} />
            </div>

            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
              <Card className="bg-card/70 border">
                <CardHeader className="gap-1.5 p-3">
                  <p className="text-muted-foreground flex items-center gap-2 text-xs tracking-wide uppercase">
                    <User className="h-3.5 w-3.5" />
                    Uploader
                  </p>
                  <p className="text-sm font-semibold">{media.user?.name || "Anonymous"}</p>
                </CardHeader>
              </Card>
              <Card className="bg-card/70 border">
                <CardHeader className="gap-1.5 p-3">
                  <p className="text-muted-foreground flex items-center gap-2 text-xs tracking-wide uppercase">
                    <HardDrive className="h-3.5 w-3.5" />
                    Size
                  </p>
                  <p className="text-sm font-semibold">{formatBytes(media.size)}</p>
                </CardHeader>
              </Card>
              <Card className="bg-card/70 border">
                <CardHeader className="gap-1.5 p-3">
                  <p className="text-muted-foreground flex items-center gap-2 text-xs tracking-wide uppercase">
                    <Calendar className="h-3.5 w-3.5" />
                    Uploaded
                  </p>
                  <p className="text-sm font-semibold">{formatDate(media.createdAt)}</p>
                </CardHeader>
              </Card>
              <Card className="bg-card/70 border">
                <CardHeader className="gap-1.5 p-3">
                  <p className="text-muted-foreground text-xs tracking-wide uppercase">File ID</p>
                  <p className="text-sm font-semibold break-all">{media.id}</p>
                </CardHeader>
              </Card>
            </div>

            {media.type === "VIDEO" && media.duration && (
              <Card className="bg-card/70 border">
                <CardHeader className="p-3">
                  <h3 className="text-sm font-medium">Duration</h3>
                  <p className="text-muted-foreground text-sm font-semibold">
                    {Math.floor(media.duration / 60)}:
                    {(media.duration % 60).toString().padStart(2, "0")}
                  </p>
                </CardHeader>
              </Card>
            )}
          </CardContent>
        </>
      </Card>
    </div>
  );
}
