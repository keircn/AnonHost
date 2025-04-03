import { Metadata } from "next";
import { MediaActions } from "@/components/media-actions";
import Image from "next/image";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

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
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
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
        select: { name: true },
      },
    },
  });

  if (!media) {
    return {
      title: "Media not found",
      description: "The requested media could not be found.",
    };
  }

  const description = `Uploaded by ${media.user?.name || "Anonymous"} • ${formatBytes(media.size)} • ${formatDate(media.createdAt)}`;

  return {
    title: media.filename,
    description,
    openGraph: {
      title: media.filename,
      description,
      images: [
        {
          url: media.url,
          width: media.width || 1200,
          height: media.height || 630,
          alt: media.filename,
        },
      ],
      type: media.type === "VIDEO" ? "video" : "website",
    },
    twitter: {
      card: "summary_large_image",
      title: media.filename,
      description,
      images: [media.url],
    },
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
        select: { name: true },
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
          {media.type === "VIDEO" ? (
            <video
              src={media.url}
              controls
              className="w-full h-full"
              autoPlay
              playsInline
            />
          ) : (
            <Image
              src={media.url}
              alt={media.filename}
              fill
              className="object-contain py-8"
              priority
            />
          )}
        </div>
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-semibold text-foreground">
              {media.filename}
            </h1>
            <MediaActions
              url={media.url}
              filename={media.filename}
              type={media.type as "IMAGE" | "VIDEO"}
            />
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
