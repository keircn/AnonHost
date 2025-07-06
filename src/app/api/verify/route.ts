import { type NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendEmail } from '@/lib/mailgun';
import { welcomeEmailTemplate } from '@/lib/email-templates';

export async function POST(req: NextRequest) {
  try {
    const { email, otp } = await req.json();

    const otpRecord = await prisma.oTP.findFirst({
      where: {
        email,
        code: otp,
        type: 'registration',
        used: false,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!otpRecord) {
      return NextResponse.json(
        { error: 'Invalid or expired code' },
        { status: 400 }
      );
    }

    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          emailVerified: new Date(),
        },
      });

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
