import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import prisma from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const usersData = await prisma.user.findMany({
    include: {
      _count: {
        select: {
          Media: true,
          Shortlink: true,
          apiKeys: true,
        },
      },
      settings: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return NextResponse.json(usersData);
}

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const { id, premium, admin } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const values: { premium?: boolean; admin?: boolean } = {};
    if (premium !== undefined) values.premium = premium;
    if (admin !== undefined) values.admin = admin;

    const [updatedUser] = await db
      .update(users)
      .set(values)
      .where(eq(users.id, id))
      .returning();

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Failed to update user:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}
