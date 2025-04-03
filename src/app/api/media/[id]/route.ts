import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
});

export async function DELETE(
    req: NextRequest,
    context: { params: { id: string } }
) {
    const { id } = await context.params;
    const session = await getServerSession(authOptions);
    const apiKey = req.headers.get("authorization")?.split("Bearer ")[1];

    if (!session && !apiKey) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = apiKey
        ? BigInt((await prisma.apiKey.findUnique({
            where: { key: apiKey },
            select: { userId: true },
        }))?.userId ?? 0)
        : BigInt(session!.user.id);

    if (!userId) {
        return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    try {
        const media = await prisma.media.findUnique({
            where: { id },
            select: { userId: true, url: true, size: true },
        });

        if (!media) {
            return NextResponse.json({ error: "Media not found" }, { status: 404 });
        }

        if (media.userId !== userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const key = media.url.replace(`${process.env.R2_PUBLIC_URL}/`, '');

        await Promise.all([
            s3Client.send(new DeleteObjectCommand({
                Bucket: process.env.R2_BUCKET_NAME!,
                Key: key,
            })),
            prisma.media.delete({ where: { id } }),
            prisma.user.update({
                where: { id: userId },
                data: { storageUsed: { decrement: media.size } },
            }),
        ]);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Delete error:", error);
        return NextResponse.json(
            { error: "Failed to delete media" },
            { status: 500 }
        );
    }
}