import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import { BMCSubscription, BMCSingleSubscriptionResponse } from "@/types/bmc";

async function checkBmcSubscription(email: string, subscriptionId?: string) {
  const accessToken = process.env.BMC_ACCESS_TOKEN;
  if (!accessToken) {
    throw new Error("BMC_ACCESS_TOKEN not configured");
  }

  try {
    if (subscriptionId) {
      const response = await fetch(
        `https://developers.buymeacoffee.com/api/v1/subscriptions/${subscriptionId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`BMC API error: ${response.status}`);
      }

      const subscription: BMCSingleSubscriptionResponse = await response.json();
      
      const isActive = !subscription.subscription_cancelled_on && 
                      !subscription.subscription_is_cancelled &&
                      new Date(subscription.subscription_current_period_end) > new Date();

      if (isActive && subscription.payer_email.toLowerCase() === email.toLowerCase()) {
        return subscription;
      }
      
      return null;
    }

    const response = await fetch(
      "https://developers.buymeacoffee.com/api/v1/subscriptions",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`BMC API error: ${response.status}`);
    }

    const data = await response.json();
    
    const activeSubscription = data.data.find((sub: BMCSubscription) => 
      sub.payer_email.toLowerCase() === email.toLowerCase() &&
      !sub.subscription_cancelled_on &&
      !sub.subscription_is_cancelled &&
      new Date(sub.subscription_current_period_end) > new Date()
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
    if (!session?.user?.email || !session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const subscriptionId = url.searchParams.get("subscriptionId");
    
    const subscription = await checkBmcSubscription(session.user.email, subscriptionId || undefined);

    if (subscription) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { premium: true },
      });

      return NextResponse.json({ subscribed: true, subscription });
    }

    return NextResponse.json({ subscribed: false });
  } catch (error) {
    console.error("BMC subscription check error:", error);
    return NextResponse.json(
      { error: "Failed to check subscription status" },
      { status: 500 }
    );
  }
}