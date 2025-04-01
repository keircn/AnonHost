import { Metadata } from "next";
import { ImageActions } from "@/components/image-actions";
import Image from "next/image";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface Props {
  params: { id?: string[] }; // Make 'id' optional
  searchParams: { [key: string]: string | string[] | undefined }; // Add searchParams
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

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = params;
  const imageId = id?.[0]; // Use optional chaining

  if (!imageId) {
    return {
      title: "Image not found",
      description: "The requested image could not be found.",
    };
  }

  const image = await prisma.image.findUnique({
    where: { id: imageId },
    include: {
      user: {
        select: { name: true },
      },
    },
  });

  if (!image) {
    return {
      title: "Image not found",
      description: "The requested image could not be found.",
    };
  }

  const description = `Uploaded by ${image.user?.name || "Anonymous"} • ${formatBytes(image.size)} • ${formatDate(image.createdAt)}`;

  return {
    title: image.filename,
    description,
    openGraph: {
      title: image.filename,
      description,
      images: [
        {
          url: image.url,
          width: image.width || 1200,
          height: image.height || 630,
          alt: image.filename,
        },
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: image.filename,
      description,
      images: [image.url],
    },
  };
}

export default async function ImagePage({ params }: Props) {
  const { id } = params;
  const imageId = id?.[0]; // Use optional chaining

  if (!imageId) {
    notFound();
    return null; // Add a return statement to satisfy TypeScript
  }

  const image = await prisma.image.findUnique({
    where: { id: imageId },
    include: {
      user: {
        select: { name: true },
      },
    },
  });

  if (!image) {
    notFound();
    return null; // Add a return statement to satisfy TypeScript
  }

  return (
    <div className="container py-8">
      <Card className="max-w-4xl mx-auto">
        <div className="relative aspect-video">
          <Image
            src={image.url}
            alt={image.filename}
            fill
            className="object-contain py-8"
            priority
          />
        </div>
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-semibold text-foreground">
              {image.filename}
            </h1>
            <ImageActions url={image.url} filename={image.filename} />
          </div>

          <div className="grid grid-cols-3 gap-6">
            <Card>
              <CardHeader className="p-4">
                <h3 className="text-sm font-medium text-foreground">
                  Uploader
                </h3>
                <p className="text-sm font-semibold text-muted-foreground">
                  {image.user?.name || "Anonymous"}
                </p>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="p-4">
                <h3 className="text-sm font-medium text-foreground">Size</h3>
                <p className="text-sm font-semibold text-muted-foreground">
                  {formatBytes(image.size)}
                </p>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="p-4">
                <h3 className="text-sm font-medium text-foreground">
                  Uploaded
                </h3>
                <p className="text-sm font-semibold text-muted-foreground">
                  {formatDate(image.createdAt)}
                </p>
              </CardHeader>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
