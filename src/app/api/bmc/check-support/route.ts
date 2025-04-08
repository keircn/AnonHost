import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

interface BMCSupporter {
  email?: string;
  support_amount: string;
  currency: string;
  support_id: string;
  support_date: string;
}

interface BMCTransaction {
  payer_email?: string;
  amount: string;
  currency: string;
  transaction_id: string;
  created_at: string;
}

async function checkBmcSupport(email: string, userId: string) {
  const accessToken = process.env.BMC_ACCESS_TOKEN;
  if (!accessToken) {
    throw new Error("BMC_ACCESS_TOKEN not configured");
  }

  const existingTransaction = await prisma.transaction.findFirst({
    where: {
      user: {
        email,
      },
      type: "bmc",
      amount: {
        gte: 5,
      },
      currency: "USD",
    },
  });

  if (existingTransaction) {
    return true;
  }

  try {
    const supportersResponse = await fetch(
      "https://developers.buymeacoffee.com/api/v1/supporters",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    if (!supportersResponse.ok) {
      console.error(`BMC API error (supporters): ${supportersResponse.status}`);
    } else {
      const supportersData = await supportersResponse.json();
      if (supportersData?.data) {
        const supporter = supportersData.data.find(
          (s: BMCSupporter) =>
            s.email?.toLowerCase() === email.toLowerCase() &&
            parseFloat(s.support_amount) >= 5 &&
            s.currency === "USD",
        );

        if (supporter) {
          await prisma.transaction.create({
            data: {
              transactionId: supporter.support_id || `auto-${Date.now()}`,
              userId,
              amount: parseFloat(supporter.support_amount),
              currency: supporter.currency || "USD",
              type: "bmc",
              createdAt: new Date(supporter.support_date) || new Date(),
            },
          });

          await prisma.user.update({
            where: { id: userId },
            data: { premium: true },
          });

          return true;
        }
      }
    }

    const transactionsResponse = await fetch(
      "https://developers.buymeacoffee.com/api/v1/transactions",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    if (!transactionsResponse.ok) {
      throw new Error(
        `BMC API error (transactions): ${transactionsResponse.status}`,
      );
    }

    const transactionsData = await transactionsResponse.json();
    if (transactionsData?.data) {
      const transaction = transactionsData.data.find(
        (t: BMCTransaction) =>
          t.payer_email?.toLowerCase() === email.toLowerCase() &&
          parseFloat(t.amount) >= 5 &&
          t.currency === "USD",
      );

      if (transaction) {
        await prisma.transaction.create({
          data: {
            transactionId:
              transaction.transaction_id || `auto-tx-${Date.now()}`,
            userId,
            amount: parseFloat(transaction.amount),
            currency: transaction.currency || "USD",
            type: "bmc",
            createdAt: new Date(transaction.created_at) || new Date(),
          },
        });

        await prisma.user.update({
          where: { id: userId },
          data: { premium: true },
        });

        return true;
      }
    }

    return false;
  } catch (error) {
    console.error("Error checking BMC support:", error);
    return false;
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  console.log("Search params:", searchParams.toString());
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userEmail = session.user.email;
    const userId = session.user.id;
    const isSupporter = await checkBmcSupport(userEmail, userId);

    if (isSupporter) {
      await prisma.user.update({
        where: { id: userId },
        data: { premium: true },
      });

      return NextResponse.json({ supported: true });
    } else {
      return NextResponse.json({ supported: false });
    }
  } catch (error) {
    console.error("BMC support check error:", error);
    return NextResponse.json(
      { error: "Failed to check support status" },
      { status: 500 },
    );
  }
}
