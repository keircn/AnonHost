import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { otp } = await req.json();

    const otpRecord = await prisma.OTP.findFirst({
      where: {
        userId: BigInt(session.user.id),
        code: otp,
        type: "email-change",
        used: false,
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        user: true,
      },
    });

    if (!otpRecord) {
      return NextResponse.json(
        { error: "Invalid or expired code" },
        { status: 400 },
      );
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: session.user.id.toString() },
        data: {
          email: otpRecord.email,
          emailVerified: new Date(),
        },
      }),
      prisma.OTP.update({
        where: { id: otpRecord.id },
        data: { used: true },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to verify email change:", error);
    return NextResponse.json(
      { error: "Failed to verify email change" },
      { status: 500 },
    );
  }
}
