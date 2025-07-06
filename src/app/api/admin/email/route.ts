import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { sendEmail } from '@/lib/mailgun';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { to, subject, message } = await req.json();

  try {
    await sendEmail({
      to,
      subject,
      text: message,
      html: message.replace(/\n/g, '<br>'),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to send email:', error);
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
}
