import { NextResponse } from 'next/server';
import { and, lte, isNotNull } from 'drizzle-orm';
import path from 'path';
import { promises as fs } from 'fs';
import { db } from '@/lib/db';
import { media } from '@/lib/db/schema';
import { isR2Configured, deleteFromR2Key } from '@/lib/r2';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const now = new Date();

    const expiredMedia = await db
      .select({
        id: media.id,
        url: media.url,
      })
      .from(media)
      .where(
        and(
          isNotNull(media.expiresAt),
          lte(media.expiresAt, now)
        )
      );

    if (expiredMedia.length === 0) {
      return NextResponse.json({ deleted: 0 });
    }

    await Promise.allSettled(
      expiredMedia.map(async (item) => {
        try {
          if (isR2Configured()) {
            const r2Key = new URL(item.url).pathname.slice(1);
            await deleteFromR2Key(r2Key);
          } else {
            const uploadPath = item.url.replace(/^https?:\/\/[^/]+\/api\/upload\/storage\//, '');
            if (uploadPath !== item.url) {
              const localPath = path.join(process.cwd(), 'uploads', uploadPath);
              await fs.rm(localPath, { force: true });
            }
          }
        } catch {
          // ignore storage deletion errors
        }
      })
    );

    await db.delete(media).where(
      and(
        isNotNull(media.expiresAt),
        lte(media.expiresAt, now)
      )
    );

    return NextResponse.json({ deleted: expiredMedia.length });
  } catch (error) {
    console.error('Cleanup error:', error);
    return NextResponse.json({ error: 'Cleanup failed' }, { status: 500 });
  }
}
