import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        
        console.log("BMC Webhook payload:", JSON.stringify(body, null, 2));
    
        const signature = req.headers.get('x-bmc-signature');
        if (signature && process.env.BMC_WEBHOOK_SECRET) {
            if (!verifySignature(signature, JSON.stringify(body), process.env.BMC_WEBHOOK_SECRET)) {
                return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
            }
        }
        
        const data = body.data || body;
        
        const transactionId = data.transaction_id;
        const supporterEmail = data.supporter_email;
        const amount = data.amount || data.coffee_price;
        const currency = data.currency;
        const supportType = data.support_type;
        
        if (!transactionId || !supporterEmail) {
            console.error("Missing required fields:", { transactionId, supporterEmail });
            return NextResponse.json({ error: "Invalid webhook payload" }, { status: 400 });
        }

        const validSupportTypes = ["coffee", "Supporter", "supporter"];
        if (validSupportTypes.includes(supportType) && parseFloat(amount) >= 5 && currency === "USD") {
            const user = await prisma.user.findUnique({
                where: { email: supporterEmail }
            });
            
            if (user) {
                const existingTransaction = await prisma.transaction.findUnique({
                    where: { transactionId }
                });
                
                if (!existingTransaction) {
                    await prisma.user.update({
                        where: { id: user.id },
                        data: { premium: true }
                    });
                    
                    await prisma.transaction.create({
                        data: {
                            transactionId,
                            userId: user.id,
                            amount: parseFloat(amount),
                            currency,
                            type: "bmc",
                            createdAt: new Date()
                        }
                    });
                    
                    console.log(`User ${user.email} upgraded to premium via BMC webhook`);
                }
            } else {
                console.log(`No user found with email: ${supporterEmail}`);
            }
        } else {
            console.log("Transaction not eligible for premium upgrade:", { 
                supportType, 
                amount, 
                currency,
                eligible: validSupportTypes.includes(supportType) && parseFloat(amount) >= 5 && currency === "USD"
            });
        }
        
        return NextResponse.json({ status: "success" });
        
    } catch (error) {
        console.error("BMC webhook error:", error)
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