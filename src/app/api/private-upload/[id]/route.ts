import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { eq } from 'drizzle-orm';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { verifyApiKey } from '@/lib/auth';
import { db } from '@/lib/db';
import { apiKeys } from '@/lib/db/schema';
import { deletePrivateUploadForUser } from '@/lib/server/private-upload';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const apiKey = request.headers.get('authorization')?.split('Bearer ')[1];

  if (!session && !apiKey) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let userId: string | null = null;

  if (apiKey) {
    const user = await verifyApiKey(apiKey);
    if (!user) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
    }
    userId = user.id.toString();
    await db
      .update(apiKeys)
      .set({ lastUsed: new Date() })
      .where(eq(apiKeys.key, apiKey));
  } else {
    userId = session!.user.id.toString();
  }

  const { id } = await params;

  try {
    await deletePrivateUploadForUser(userId, id);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Failed to delete private upload';
    const status = message.includes('not found') ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
