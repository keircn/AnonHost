import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id;

  try {
    const shortlink = await prisma.shortlink.findUnique({
      where: { id },
    });

    if (!shortlink) {
      return new Response('Shortlink not found', { status: 404 });
    }

    if (shortlink.expireAt && shortlink.expireAt < new Date()) {
      return new Response('This link has expired', { status: 410 });
    }

    await prisma.shortlink.update({
      where: { id },
      data: { clicks: shortlink.clicks + 1 },
    });

    return NextResponse.redirect(shortlink.originalUrl);
  } catch (error) {
    console.error('Error redirecting shortlink:', error);
    return new Response('Internal server error', { status: 500 });
  }
}
