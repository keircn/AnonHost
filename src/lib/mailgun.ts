import formData from 'form-data';
import Mailgun from 'mailgun.js';

if (!process.env.MAILGUN_API_KEY || !process.env.MAILGUN_DOMAIN || !process.env.MAILGUN_FROM_EMAIL) {
    throw new Error('Missing Mailgun configuration');
}

const mailgun = new Mailgun(formData);
const client = mailgun.client({
    username: 'api',
    key: process.env.MAILGUN_API_KEY,
    url: 'https://api.eu.mailgun.net',
});

export async function sendEmail({
    to,
    subject,
    text,
    html,
}: {
    to: string;
    subject: string;
    text: string;
    html?: string;
}) {
    try {
        const result = await client.messages.create(process.env.MAILGUN_DOMAIN!, {
            from: process.env.MAILGUN_FROM_EMAIL,
            to: [to],
            subject,
            text,
            html,
        });
        console.log('Email sent successfully:', result.id);
        return result;
    } catch (error: unknown) {
        if (error && typeof error === 'object' && 'status' in error && 'details' in error && 'message' in error) {
            console.error('Mailgun error details:', {
                status: (error as { status: number }).status,
                details: (error as { details: string }).details,
                message: (error as { message: string }).message
            });
        }
        throw error;
    }
}