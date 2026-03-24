import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { db } from '@/lib/db';
import { otps, users } from '@/lib/db/schema';
import { and, eq, gt } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { otp } = await req.json();

    const [otpRecord] = await db
      .select()
      .from(otps)
      .where(
        and(
          eq(otps.userId, session.user.id),
          eq(otps.code, otp),
          eq(otps.type, 'email-change'),
          eq(otps.used, false),
          gt(otps.expiresAt, new Date())
        )
      )
      .limit(1);

    if (!otpRecord) {
      return NextResponse.json(
        { error: 'Invalid or expired code' },
        { status: 400 }
      );
    }

    await db.transaction(async (tx) => {
      await tx
        .update(users)
        .set({
          email: otpRecord.email,
          emailVerified: new Date(),
        })
        .where(eq(users.id, session.user.id.toString()));

      await tx
        .update(otps)
        .set({ used: true })
        .where(eq(otps.id, otpRecord.id));
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to verify email change:', error);
    return NextResponse.json(
      { error: 'Failed to verify email change' },
      { status: 500 }
    );
  }
}
