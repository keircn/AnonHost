import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { shortlinks } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const [shortlink] = await db
      .select()
      .from(shortlinks)
      .where(eq(shortlinks.id, id))
      .limit(1);

    if (!shortlink) {
      return new Response('Shortlink not found', { status: 404 });
    }

    if (shortlink.expireAt && shortlink.expireAt < new Date()) {
      return new Response('This link has expired', { status: 410 });
    }

    await db
      .update(shortlinks)
      .set({ clicks: sql`${shortlinks.clicks} + 1` })
      .where(eq(shortlinks.id, id));

    return NextResponse.redirect(shortlink.originalUrl);
  } catch (error) {
    console.error('Error redirecting shortlink:', error);
    return new Response('Internal server error', { status: 500 });
  }
}
