import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        
        const signature = req.headers.get('x-bmc-signature');
        if (!verifySignature(signature, JSON.stringify(body), process.env.BMC_WEBHOOK_SECRET)) {
            return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
        }
        
        const { transaction_id, supporter_email, amount, currency, support_type } = body;
        
        if (!transaction_id || !supporter_email) {
            return NextResponse.json({ error: "Invalid webhook payload" }, { status: 400 });
        }
        
        if (support_type === "coffee" && parseFloat(amount) >= 5 && currency === "USD") {
            const user = await prisma.user.findUnique({
                where: { email: supporter_email }
            });
            
            if (user) {
                const existingTransaction = await prisma.transaction.findUnique({
                    where: { transactionId: transaction_id }
                });
                
                if (!existingTransaction) {
                    await prisma.user.update({
                        where: { id: user.id },
                        data: { premium: true }
                    });
                    
                    await prisma.transaction.create({
                        data: {
                            transactionId: transaction_id,
                            userId: user.id,
                            amount: parseFloat(amount),
                            currency,
                            type: "bmc",
                            createdAt: new Date()
                        }
                    });
                }
            }
        }
        
        return NextResponse.json({ status: "success" });
        
    } catch (error) {
        console.error("BMC webhook error:", error);
        return NextResponse.json({ status: "processed" });
    }
}

async function verifySignature(signature: string | null, payload: string, BMC_WEBHOOK_SECRET: string | undefined): Promise<boolean> {
    if (!signature || !BMC_WEBHOOK_SECRET) {
        return false;
    }

    const crypto = await import('crypto');
    const hmac = crypto.createHmac('sha256', BMC_WEBHOOK_SECRET);
    hmac.update(payload);
    const expectedSignature = hmac.digest('hex');

    return signature === expectedSignature;
}
