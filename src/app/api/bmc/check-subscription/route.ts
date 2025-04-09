import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import { BMCSubscription } from "@/types/bmc";

async function checkBmcSubscription(email: string) {
  const accessToken = process.env.BMC_ACCESS_TOKEN;
  if (!accessToken) {
    throw new Error("BMC_ACCESS_TOKEN not configured");
  }

  try {
    const response = await fetch(
      "https://developers.buymeacoffee.com/api/v1/subscriptions?status=active",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    if (!response.ok) {
      throw new Error(`BMC API error: ${response.status}`);
    }

    const data = await response.json();

    const activeSubscription = data.data.find(
      (sub: BMCSubscription) =>
        sub.payer_email.toLowerCase() === email.toLowerCase() &&
        !sub.subscription_cancelled_on &&
        !sub.subscription_is_cancelled &&
        new Date(sub.subscription_current_period_end) > new Date(),
    );

    return activeSubscription || null;
  } catch (error) {
    console.error("Error checking BMC subscription:", error);
    throw error;
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const emailToCheck = url.searchParams.get("email") || session.user.email;

    if (!emailToCheck) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const existingBMCEmail = await prisma.bMCEmail.findUnique({
      where: { email: emailToCheck.toLowerCase() },
    });

    if (existingBMCEmail && existingBMCEmail.userId !== session.user.id) {
      return NextResponse.json(
        { 
          error: "This BuyMeACoffee email is already linked to another account",
          code: "EMAIL_ALREADY_USED"
        }, 
        { status: 400 }
      );
    }

    const subscription = await checkBmcSubscription(emailToCheck);

    if (subscription) {
      await prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: session.user.id },
          data: { premium: true },
        });

        if (!existingBMCEmail) {
          await tx.bMCEmail.create({
            data: {
              email: emailToCheck.toLowerCase(),
              userId: session.user.id,
            },
          });
        }
      });

      return NextResponse.json({ subscribed: true, subscription });
    }

    return NextResponse.json({ subscribed: false });
  } catch (error) {
    console.error("BMC subscription check error:", error);
    return NextResponse.json(
      { error: "Failed to check subscription status" },
      { status: 500 },
    );
  }
}