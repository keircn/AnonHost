import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

async function checkBmcSupport(email: string) {
  const accessToken = process.env.BMC_ACCESS_TOKEN;
  if (!accessToken) {
    throw new Error("BMC_ACCESS_TOKEN not configured");
  }

  const existingTransaction = await prisma.transaction.findFirst({
    where: {
      user: {
        email
      },
      type: "bmc",
      amount: {
        gte: 5
      },
      currency: "USD"
    }
  });

  if (existingTransaction) {
    return true;
  }

  try {
    const response = await fetch("https://developers.buymeacoffee.com/api/v1/supporters", {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      throw new Error(`BMC API error: ${response.status}`);
    }

    const data = await response.json();
    if (!data?.data) return false;

    const supporter = data.data.find((s: any) => 
      s.email?.toLowerCase() === email.toLowerCase() && 
      parseFloat(s.support_amount) >= 5 &&
      s.currency === "USD"
    );

    if (supporter) {
      await prisma.transaction.create({
        data: {
          transactionId: supporter.support_id || `auto-${Date.now()}`,
          userId: supporter.user_id,
          amount: parseFloat(supporter.support_amount),
          currency: supporter.currency,
          type: "bmc",
          createdAt: new Date(supporter.support_date) || new Date()
        }
      });
      
      await prisma.user.update({
        where: { email },
        data: { premium: true }
      });
      
      return true;
    }
    
    return false;
  } catch (error) {
    console.error("Error checking BMC support:", error);
    return false;
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userEmail = session.user.email;
    const isSupporter = await checkBmcSupport(userEmail);
    
    if (isSupporter) {
      await prisma.user.update({
        where: { email: userEmail },
        data: { premium: true }
      });
      
      return NextResponse.json({ supported: true });
    } else {
      return NextResponse.json({ supported: false });
    }
  } catch (error) {
    console.error("BMC support check error:", error);
    return NextResponse.json(
      { error: "Failed to check support status" },
      { status: 500 }
    );
  }
}