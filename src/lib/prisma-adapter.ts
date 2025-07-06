import { PrismaAdapter } from "@auth/prisma-adapter";
import type { Adapter } from "next-auth/adapters";
import type { PrismaClient } from "@prisma/client";

export function CustomPrismaAdapter(prisma: PrismaClient): Adapter {
  const base = PrismaAdapter(prisma);
  return {
    ...base,
    async getUser(id: string) {
      const user = await prisma.user.findUnique({ where: { id } });
      if (!user || !user.email) return null;
      return {
        ...user,
        id: user.id,
        email: user.email,
        emailVerified: user.emailVerified,
        name: user.name,
        image: user.image,
        uid: user.uid,
        createdAt: user.createdAt.toISOString(),
      };
    },
    async getUserByEmail(email: string) {
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user || !user.email) return null;
      return {
        ...user,
        id: user.id,
        email: user.email,
        emailVerified: user.emailVerified,
        name: user.name,
        image: user.image,
        uid: user.uid,
        createdAt: user.createdAt.toISOString(),
      };
    },
  } as any;
}
