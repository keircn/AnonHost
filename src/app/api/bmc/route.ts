import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

async function verifyBmcTransaction(transactionId: string) {
    if (process.env.NODE_ENV === 'development' && transactionId.startsWith('BMC_TEST_')) {
        console.log('Development mode: Using test transaction data');
        
        const testTransaction = await prisma.transaction.findUnique({
            where: { transactionId }
        });

        if (testTransaction) {
            return {
                amount: testTransaction.amount.toString(),
                currency: testTransaction.currency,
                email: "keiran0@proton.me",
                transactionId: testTransaction.transactionId,
                createdAt: testTransaction.createdAt
            };
        }
    }

    const accessToken = process.env.BMC_ACCESS_TOKEN;
    if (!accessToken) {
        throw new Error("BMC_ACCESS_TOKEN not configured");
    }

    const response = await fetch("https://developers.buymeacoffee.com/api/v1/supporters", {
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json'
        }
    });

    if (!response.ok) {
        const errorBody = await response.text();
        console.error('BMC API Response:', {
            status: response.status,
            statusText: response.statusText,
            body: errorBody
        });
        throw new Error(`BMC API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Full BMC API response:', JSON.stringify(data, null, 2));

    const transaction = data?.data?.find((supporter: any) =>
        supporter.transaction_id === transactionId
    );

    if (transaction) {
        return {
            amount: transaction.support_coffee_price,
            currency: transaction.support_currency,
            email: transaction.support_email || transaction.payer_email,
            transactionId: transaction.transaction_id,
            createdAt: new Date(transaction.support_created_on)
        };
    }

    return null;
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
        const existingTransaction = await prisma.transaction.findFirst({
            where: { 
                transactionId,
                processed: true
            }
        });

        if (existingTransaction) {
            return NextResponse.json(
                { error: "Transaction already processed" },
                { status: 400 },
            );
        }

        const transaction = await verifyBmcTransaction(transactionId);
        
        console.log('Transaction verification result:', transaction);

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

        await prisma.$transaction([
            prisma.user.update({
                where: { id: session.user.id },
                data: { premium: true },
            }),
            prisma.transaction.upsert({
                where: { transactionId },
                create: {
                    transactionId,
                    userId: session.user.id,
                    amount: parseFloat(transaction.amount),
                    currency: transaction.currency,
                    type: "bmc",
                    processed: true,
                    createdAt: transaction.createdAt
                },
                update: {
                    processed: true
                }
            })
        ]);

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