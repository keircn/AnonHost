import formData from 'form-data';
import Mailgun from 'mailgun.js';

if (
  !process.env.MAILGUN_API_KEY ||
  !process.env.MAILGUN_DOMAIN ||
  !process.env.MAILGUN_FROM_EMAIL
) {
  throw new Error('Missing Mailgun configuration');
}

const mailgun = new Mailgun(formData);
const client = mailgun.client({
  username: 'api',
  key: process.env.MAILGUN_API_KEY,
  url: process.env.MAILGUN_API_URL || 'https://api.mailgun.net',
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
    console.log('Attempting to send email:', {
      to,
      subject,
      domain: process.env.MAILGUN_DOMAIN,
      from: process.env.MAILGUN_FROM_EMAIL,
    });

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
    console.error('Failed to send email:', error);

    if (
      error &&
      typeof error === 'object' &&
      'status' in error &&
      'details' in error &&
      'message' in error
    ) {
      console.error('Mailgun error details:', {
        status: (error as { status: number }).status,
        details: (error as { details: string }).details,
        message: (error as { message: string }).message,
      });
    }
    throw error;
  }
}
