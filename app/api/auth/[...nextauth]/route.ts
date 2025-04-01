import NextAuth from "next-auth"
import DiscordProvider from "next-auth/providers/discord"
import { PrismaAdapter } from "@auth/prisma-adapter"
import prisma from "@/lib/prisma"

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID as string,
      clientSecret: process.env.DISCORD_CLIENT_SECRET as string,
    }),
  ],
  callbacks: {
    async session({ session, user }: any) {
      session.user.id = user.id
      return session
    },
  },
  pages: {
    signIn: "/",
    error: "/",
  },
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }

