import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import { sendEmail } from "@/lib/mailgun";
import { generateOTP } from "@/lib/utils";
import { verificationEmailTemplate } from "@/lib/email-templates";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await prisma.otp.create({
      data: {
        email,
        code: otp,
        expiresAt,
      },
    });

    const { subject, text, html } = verificationEmailTemplate(otp, email);
    await sendEmail({
      to: email,
      subject,
      text,
      html,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to send OTP:", error);
    return NextResponse.json(
      { error: "Failed to send verification code" },
      { status: 500 },
    );
  }
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { email } = await req.json();

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser && existingUser.id !== BigInt(session.user.id)) {
      return NextResponse.json(
        { error: "Email already in use" },
        { status: 400 },
      );
    }

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await prisma.otp.deleteMany({
      where: {
        userId: BigInt(session.user.id),
        type: "EMAIL_CHANGE",
        used: false,
      },
    });

    await prisma.otp.create({
      data: {
        userId: BigInt(session.user.id),
        email,
        code: otp,
        expiresAt,
        type: "EMAIL_CHANGE",
      },
    });

    const { subject, text, html } = verificationEmailTemplate(otp, email);
    await sendEmail({
      to: email,
      subject,
      text,
      html,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to initiate email change:", error);
    return NextResponse.json(
      { error: "Failed to process email change" },
      { status: 500 },
    );
  }
}