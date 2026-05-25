import nodemailer from 'nodemailer';

type SendEmailInput = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required SMTP configuration: ${name}`);
  }
  return value;
}

function createTransporter() {
  const host = getRequiredEnv('SMTP_HOST');
  const port = Number(process.env.SMTP_PORT || '587');
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: user && pass ? { user, pass } : undefined,
  });
}

function getFromAddress(): string {
  const fromEmail = getRequiredEnv('SMTP_FROM_EMAIL');
  const fromName = process.env.SMTP_FROM_NAME;
  return fromName ? `${fromName} <${fromEmail}>` : fromEmail;
}

export async function sendEmail({ to, subject, text, html }: SendEmailInput) {
  const transporter = createTransporter();
  const from = getFromAddress();

  const result = await transporter.sendMail({
    from,
    to,
    subject,
    text,
    html,
  });

  console.log('Email sent successfully:', result.messageId);
  return result;
}
