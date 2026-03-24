import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { db } from '@/lib/db';
import { apiKeys } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function DELETE(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;
  const { id } = params;

  const [apiKey] = await db
    .select()
    .from(apiKeys)
    .where(eq(apiKeys.id, id))
    .limit(1);

  if (!apiKey) {
    return NextResponse.json({ error: 'API key not found' }, { status: 404 });
  }

  if (apiKey.userId !== userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await db.delete(apiKeys).where(eq(apiKeys.id, id));

  return NextResponse.json({
    success: true,
    message: 'API key deleted successfully',
  });
}
