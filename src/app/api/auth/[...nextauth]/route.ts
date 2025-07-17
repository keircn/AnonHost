import NextAuth, { AuthOptions, User } from 'next-auth';
import DiscordProvider from 'next-auth/providers/discord';
import CredentialsProvider from 'next-auth/providers/credentials';
import { CustomPrismaAdapter } from '@/lib/prisma-adapter';
import prisma from '@/lib/prisma';
import { sendEmail } from '@/lib/mailgun';
import {
  welcomeEmailTemplate,
  verificationEmailTemplate,
} from '@/lib/email-templates';
import { generateOTP } from '@/lib/utils';

declare global {
  interface BigInt {
    toJSON(): string;
  }
}

BigInt.prototype.toJSON = function (): string {
  return this.toString();
};

export const authOptions: AuthOptions = {
  adapter: CustomPrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      id: 'email-login',
      name: 'Email',
      credentials: {
        email: { label: 'Email', type: 'email' },
        otp: { label: 'OTP', type: 'text' },
      },
      async authorize(credentials): Promise<User | null> {
        if (!credentials?.email || !credentials?.otp) return null;

        const dbUser = await prisma.user.findUnique({
          where: { email: credentials.email },
          select: {
            id: true,
            email: true,
            name: true,
            image: true,
            admin: true,
            premium: true,
            emailVerified: true,
            uid: true,
            createdAt: true,
          },
        });

        if (!dbUser) return null;

        const otpRecord = await prisma.oTP.findFirst({
          where: {
            email: credentials.email,
            code: credentials.otp,
            type: 'registration',
            used: false,
            expiresAt: { gt: new Date() },
          },
        });

        if (!otpRecord) return null;

        await prisma.oTP.update({
          where: { id: otpRecord.id },
          data: { used: true },
        });

        return {
          id: dbUser.id,
          email: dbUser.email,
          name: dbUser.name,
          image: dbUser.image,
          admin: dbUser.admin,
          premium: dbUser.premium,
          emailVerified: dbUser.emailVerified,
          uid: dbUser.uid,
          createdAt: dbUser.createdAt.toISOString(),
        };
      },
    }),
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID as string,
      clientSecret: process.env.DISCORD_CLIENT_SECRET as string,
      authorization: {
        params: {
          scope: 'identify email guilds',
          prompt: 'consent',
        },
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },
  cookies: {
    sessionToken: {
      name: `${process.env.NODE_ENV === 'production' ? '__Secure-' : ''}next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  callbacks: {
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!;
        session.user.admin = token.admin as boolean;
        session.user.premium = token.premium as boolean;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.admin = user.admin;
        token.premium = user.premium;
        token.uid = user.uid;
        token.createdAt = user.createdAt;
      }
      return token;
    },
    async signIn({ user, account }) {
      if (account?.error === 'access_denied') {
        return false;
      }

      if (account?.provider === 'discord') {
        try {
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email! },
            select: { id: true, emailVerified: true },
          });

          if (!existingUser) {
            console.log('Sending welcome email to new user:', user.email);
            const template = welcomeEmailTemplate(user.name || 'there');
            await sendEmail({
              to: user.email!,
              ...template,
            }).catch((error) => {
              console.error('Failed to send welcome email:', {
                error,
                user: user.email,
              });
            });
          }

          if (!existingUser?.emailVerified) {
            console.log(
              'Sending verification email to Discord user:',
              user.email
            );
            const otp = generateOTP();
            const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

            await prisma.oTP.deleteMany({
              where: {
                email: user.email!,
                type: 'registration',
                used: false,
              },
            });

            await prisma.oTP.create({
              data: {
                email: user.email!,
                code: otp,
                expiresAt,
                type: 'registration',
              },
            });

            const { subject, text, html } = verificationEmailTemplate(
              otp,
              user.email!,
              'login'
            );

            await sendEmail({
              to: user.email!,
              subject,
              text,
              html,
            }).catch((error) => {
              console.error('Failed to send verification email:', {
                error,
                user: user.email,
              });
            });
          }
        } catch (error) {
          console.error('Error in signIn callback:', error);
        }
      }

      if (account?.provider === 'email-login') {
        try {
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email! },
            select: { id: true, emailVerified: true },
          });

          if (!existingUser) {
            console.log('Sending welcome email to new email user:', user.email);
            const welcomeTemplate = welcomeEmailTemplate(user.name || 'there');
            await sendEmail({
              to: user.email!,
              ...welcomeTemplate,
            }).catch((error) => {
              console.error('Failed to send welcome email:', {
                error,
                user: user.email,
              });
            });
          }

          if (!existingUser?.emailVerified) {
            console.log('Sending verification email to user:', user.email);
            const otp = generateOTP();
            const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

            await prisma.oTP.deleteMany({
              where: {
                email: user.email!,
                type: 'registration',
                used: false,
              },
            });

            await prisma.oTP.create({
              data: {
                email: user.email!,
                code: otp,
                expiresAt,
                type: 'registration',
              },
            });

            const { subject, text, html } = verificationEmailTemplate(
              otp,
              user.email!,
              'login'
            );

            await sendEmail({
              to: user.email!,
              subject,
              text,
              html,
            }).catch((error) => {
              console.error('Failed to send verification email:', {
                error,
                user: user.email,
              });
            });
          }
        } catch (error) {
          console.error('Error in email signIn callback:', error);
        }
      }
      return true;
    },
  },
  pages: {
    signIn: '/',
    error: '/',
    signOut: '/logout',
    verifyRequest: '/verify-request',
  },
  debug: process.env.NODE_ENV === 'development',
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
