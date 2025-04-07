import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

// BMC API client
async function verifyBmcTransaction(transactionId: string) {
  const accessToken = process.env.BMC_ACCESS_TOKEN;
  if (!accessToken) {
    throw new Error("BMC_ACCESS_TOKEN not configured");
  }

  const response = await fetch(`https://developers.buymeacoffee.com/api/v1/transactions?transaction_id=${transactionId}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });

  if (!response.ok) {
    throw new Error(`BMC API error: ${response.status}`);
  }

  const data = await response.json();
  return data?.data?.length > 0 ? data.data[0] : null;
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { transactionId } = body;
  if (!transactionId) {
    return NextResponse.json(
      { error: "Transaction ID is required" },
      { status: 400 },
    );
  }

  try {
    const existingTransaction = await prisma.transaction.findUnique({
      where: { transactionId }
    });
    
    if (existingTransaction) {
      return NextResponse.json(
        { error: "Transaction already processed" },
        { status: 400 },
      );
    }

    const transaction = await verifyBmcTransaction(transactionId);
    
    if (!transaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 },
      );
    }
    
    if (parseFloat(transaction.amount) < 5 || transaction.currency !== "USD") {
      return NextResponse.json(
        { error: "Transaction amount is insufficient for premium" },
        { status: 400 },
      );
    }
    
    await prisma.user.update({
      where: { id: session.user.id },
      data: { premium: true },
    });
    
    await prisma.transaction.create({
      data: {
        transactionId,
        userId: session.user.id,
        amount: parseFloat(transaction.amount),
        currency: transaction.currency,
        type: "bmc",
        createdAt: new Date()
      }
    });
    
    return NextResponse.json(
      { message: "User upgraded to premium" },
      { status: 200 },
    );
  } catch (error) {
    console.error("BuyMeACoffee integration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}