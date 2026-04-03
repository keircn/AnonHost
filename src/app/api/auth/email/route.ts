import { type NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";
import { generateOTP } from "@/lib/utils";
import { verificationEmailTemplate } from "@/lib/email-templates";
import { db } from "@/lib/db";
import { otps } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    const normalizedEmail = String(email || "")
      .trim()
      .toLowerCase();

    if (!normalizedEmail) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await db
      .delete(otps)
      .where(
        and(eq(otps.email, normalizedEmail), eq(otps.type, "registration"), eq(otps.used, false)),
      );

    await db.insert(otps).values({
      email: normalizedEmail,
      code: otp,
      expiresAt,
      type: "registration",
    });

    const { subject, text, html } = verificationEmailTemplate(otp, normalizedEmail, "login");

    await sendEmail({
      to: normalizedEmail,
      subject,
      text,
      html,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to send OTP:", error);
    return NextResponse.json({ error: "Failed to send verification code" }, { status: 500 });
  }
}
