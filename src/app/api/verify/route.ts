import { type NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";
import { welcomeEmailTemplate } from "@/lib/email-templates";
import { db } from "@/lib/db";
import { otps, users } from "@/lib/db/schema";
import { and, desc, eq, gt, inArray } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const { email, otp } = await req.json();
    const normalizedEmail = String(email || "")
      .trim()
      .toLowerCase();
    const normalizedOtp = String(otp || "")
      .trim()
      .replace(/\s+/g, "");

    if (!normalizedEmail || !normalizedOtp) {
      return NextResponse.json(
        { error: "Email and verification code are required" },
        { status: 400 },
      );
    }

    const [otpRecord] = await db
      .select()
      .from(otps)
      .where(
        and(
          eq(otps.email, normalizedEmail),
          eq(otps.used, false),
          inArray(otps.type, ["registration", "login"]),
          gt(otps.expiresAt, new Date()),
        ),
      )
      .orderBy(desc(otps.createdAt))
      .limit(1);

    if (!otpRecord || otpRecord.code !== normalizedOtp) {
      return NextResponse.json({ error: "Invalid or expired code" }, { status: 400 });
    }

    const existing = await db.select().from(users).where(eq(users.email, normalizedEmail)).limit(1);

    let user = existing[0] ?? null;

    if (!user) {
      const inserted = await db
        .insert(users)
        .values({
          email: normalizedEmail,
          emailVerified: new Date(),
        })
        .returning();
      user = inserted[0] ?? null;

      const template = welcomeEmailTemplate("there");
      await sendEmail({
        to: normalizedEmail,
        ...template,
      }).catch((error) => {
        console.error("Failed to send welcome email:", error);
      });
    }

    return NextResponse.json({
      success: true,
      email: normalizedEmail,
      otp: normalizedOtp,
    });
  } catch (error) {
    console.error("Failed to verify OTP:", error);
    return NextResponse.json({ error: "Failed to verify code" }, { status: 500 });
  }
}
