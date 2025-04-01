import { Metadata, ResolvingMetadata } from 'next'
import { ImageActions } from '@/components/image-actions'
import Image from 'next/image'
import prisma from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Copy, Download } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

interface Props {
    params: { id: string[] }
}

function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

function formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short'
    }).format(date)
}

export async function generateMetadata(
    { params }: Props,
    parent: ResolvingMetadata
): Promise<Metadata> {
    const { id } = await params
    const imageId = id[0]

    const image = await prisma.image.findUnique({
        where: { id: imageId },
        include: {
            user: {
                select: { name: true },
            },
        },
    })

    if (!image) {
        return {
            title: 'Image not found',
            description: 'The requested image could not be found.',
        }
    }

    const description = `Uploaded by ${image.user.name || 'Anonymous'} • ${formatBytes(image.size)} • ${formatDate(image.createdAt)}`

    return {
        title: image.filename,
        description,
        openGraph: {
            title: image.filename,
            description,
            images: [{
                url: image.url,
                width: image.width || 1200,
                height: image.height || 630,
                alt: image.filename,
            }],
            type: 'website',
        },
        twitter: {
            card: 'summary_large_image',
            title: image.filename,
            description,
            images: [image.url],
        },
    }
}

export default async function ImagePage({ params }: Props) {
    const { id } = await params
    const imageId = id[0]
    const image = await prisma.image.findUnique({
        where: { id: imageId },
        include: {
            user: {
                select: { name: true },
            },
        },
    })

    if (!image) {
        notFound()
    }

    return (
        <div className="container py-8">
            <Card className="max-w-4xl mx-auto">
                <div className="relative aspect-video">
                    <Image
                        src={image.url}
                        alt={image.filename}
                        fill
                        className="object-contain"
                        priority
                    />
                </div>
                <CardContent className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-2xl font-semibold text-gray-900">
                            {image.filename}
                        </h1>
                        <ImageActions url={image.url} filename={image.filename} />
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {/* ...existing cards... */}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}