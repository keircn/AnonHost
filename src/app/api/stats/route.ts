import { NextResponse } from "next/server";
import { Stats } from "@/types/stats";
import { db } from "@/lib/db";
import { media, users } from "@/lib/db/schema";
import { sql } from "drizzle-orm";

const cache = {
  data: null as Stats | null,
  timestamp: 0,
  TTL: 3600000,
};

export async function GET() {
  try {
    const now = Date.now();

    if (cache.data && now - cache.timestamp < cache.TTL) {
      return NextResponse.json(cache.data);
    }

    const [userCountRow, totalUploadsRow, storageUsedRow] = await Promise.all([
      db.select({ value: sql<number>`count(*)::int` }).from(users),
      db.select({ value: sql<number>`count(*)::int` }).from(media),
      db.select({ total: sql<number>`coalesce(sum(${media.size}), 0)::int` }).from(media),
    ]);

    const userCount = userCountRow[0]?.value ?? 0;
    const totalUploads = totalUploadsRow[0]?.value ?? 0;
    const storageUsed = storageUsedRow[0]?.total ?? 0;

    const stats: Stats = {
      users: userCount || 0,
      uploads: totalUploads || 0,
      storage: Number(storageUsed || 0),
    };

    cache.data = stats;
    cache.timestamp = now;

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Failed to fetch stats:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
