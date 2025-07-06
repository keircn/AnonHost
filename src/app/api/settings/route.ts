import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;

  let settings = await prisma.settings.findUnique({
    where: { userId },
  });

  if (!settings) {
    settings = await prisma.settings.create({
      data: {
        userId,
        enableNotifications: true,
        makeImagesPublic: false,
        enableDirectLinks: true,
      },
    });
  }

  return NextResponse.json(settings);
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    const data = await req.json();

    const validSettings = {
      enableNotifications: Boolean(data.enableNotifications),
      makeImagesPublic: Boolean(data.makeImagesPublic),
      enableDirectLinks: Boolean(data.enableDirectLinks),
      customDomain: data.customDomain || null,
    };

    const settings = await prisma.settings.upsert({
      where: { userId },
      update: validSettings,
      create: {
        userId,
        ...validSettings,
      },
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Failed to update settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
