import { type NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendEmail } from "@/lib/mailgun";
import { generateOTP } from "@/lib/utils";
import { verificationEmailTemplate } from "@/lib/email-templates";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await prisma.oTP.deleteMany({
      where: {
        email,
        type: "registration",
        used: false,
      },
    });

    await prisma.oTP.create({
      data: {
        email,
        code: otp,
        expiresAt,
        type: "registration",
      },
    });

    const { subject, text, html } = verificationEmailTemplate(
      otp,
      email,
      "login",
    );

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
