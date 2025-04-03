import NextAuth, { AuthOptions } from "next-auth";
import DiscordProvider from "next-auth/providers/discord";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "@/lib/prisma";
import { sendEmail } from "@/lib/mailgun";
import { welcomeEmailTemplate } from "@/lib/email-templates";

declare global {
  interface BigInt {
    toJSON(): string;
  }
}

BigInt.prototype.toJSON = function (): string {
  return this.toString();
};

export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID as string,
      clientSecret: process.env.DISCORD_CLIENT_SECRET as string,
      authorization: {
        params: {
          scope: "identify email guilds",
          prompt: "consent",
        },
      },
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      return {
        ...session,
        user: {
          ...session.user,
          id: user.id.toString(),
          admin: user.admin,
          premium: user.premium,
        },
      };
    },
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
      }
      return token;
    },
    async signIn({ user, account }) {
      if (account?.error === "access_denied") {
        return false;
      }

      if (account?.provider === "discord") {
        try {
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email! },
            select: { id: true },
          });

          if (!existingUser) {
            console.log("Sending welcome email to new user:", user.email);
            const template = welcomeEmailTemplate(user.name || "there");
            await sendEmail({
              to: user.email!,
              ...template,
            }).catch((error) => {
              console.error("Failed to send welcome email:", {
                error,
                user: user.email,
              });
            });
          }
        } catch (error) {
          console.error("Error in signIn callback:", error);
        }
      }
      return true;
    },
  },
  pages: {
    signIn: "/",
    error: "/",
    signOut: "/logout",
    verifyRequest: "/verify-request",
  },
  debug: process.env.NODE_ENV === "development",
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
