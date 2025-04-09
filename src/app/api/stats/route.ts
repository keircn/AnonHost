import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Stats } from "@/types/stats";

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

    const [userCount, totalUploads, storageUsed] = await Promise.all([
      prisma.user.count(),
      prisma.media.count(),
      prisma.$queryRaw<[{ total: bigint }]>`
        SELECT COALESCE(SUM("size"), 0) as total 
        FROM "Media"
      `,
    ]);

    const stats: Stats = {
      users: userCount || 0,
      uploads: totalUploads || 0,
      storage: Number(storageUsed[0]?.total || 0),
    };

    cache.data = stats;
    cache.timestamp = now;

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Failed to fetch stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 },
    );
  }
}
