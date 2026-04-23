import { PrismaAdapter } from '@auth/prisma-adapter';
import { NextAuthOptions } from 'next-auth';
import EmailProvider from 'next-auth/providers/email';
import { prisma } from './prisma';
import { ADMIN_EMAILS } from './constants';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as NextAuthOptions['adapter'],
  providers: [
    EmailProvider({
      server: process.env.EMAIL_SERVER ?? {
        host: process.env.EMAIL_SERVER_HOST,
        port: Number(process.env.EMAIL_SERVER_PORT ?? 465),
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM,
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      if (session.user && user) {
        session.user.id = user.id;
        // user object from database adapter already has all fields
        session.user.role = (user as { role?: string }).role ?? 'user';
      }
      return session;
    },
    async signIn({ user }) {
      if (!user.email) return true;
      // Auto-elevate admin emails on sign-in
      if (ADMIN_EMAILS.includes(user.email)) {
        try {
          await prisma.user.update({
            where: { email: user.email },
            data: { role: 'admin' },
          });
        } catch {
          // User might not exist yet on first sign-in; adapter creates them
        }
      }
      return true;
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
  session: {
    strategy: 'database',
  },
  debug: process.env.NODE_ENV === 'development',
};

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: string;
    };
  }
}
