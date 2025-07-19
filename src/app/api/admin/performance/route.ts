import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getCacheStats } from '@/lib/storage-cache';

export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  // Only allow admin users to access performance stats
  if (!session?.user?.admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const cacheStats = getCacheStats();
    
    // Calculate cache hit rate
    const totalRequests = cacheStats.hits + cacheStats.misses;
    const hitRate = totalRequests > 0 ? (cacheStats.hits / totalRequests) * 100 : 0;
    
    const stats = {
      storageCache: {
        ...cacheStats,
        hitRate: `${hitRate.toFixed(2)}%`,
      },
      system: {
        nodeVersion: process.version,
        platform: process.platform,
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
      },
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching performance stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch performance stats' },
      { status: 500 }
    );
  }
}