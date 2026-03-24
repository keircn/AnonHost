import { type NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';
import { welcomeEmailTemplate } from '@/lib/email-templates';
import { db } from '@/lib/db';
import { otps, users } from '@/lib/db/schema';
import { and, eq, gt } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  try {
    const { email, otp } = await req.json();

    const [otpRecord] = await db
      .select()
      .from(otps)
      .where(
        and(
          eq(otps.email, email),
          eq(otps.code, otp),
          eq(otps.type, 'registration'),
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

    const existing = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    let user = existing[0] ?? null;

    if (!user) {
      const inserted = await db
        .insert(users)
        .values({
          email,
          emailVerified: new Date(),
        })
        .returning();
      user = inserted[0] ?? null;

      const template = welcomeEmailTemplate('there');
      await sendEmail({
        to: email,
        ...template,
      }).catch((error) => {
        console.error('Failed to send welcome email:', error);
      });
    }

    return NextResponse.json({
      success: true,
      email,
      otp,
    });
  } catch (error) {
    console.error('Failed to verify OTP:', error);
    return NextResponse.json(
      { error: 'Failed to verify code' },
      { status: 500 }
    );
  }
}
