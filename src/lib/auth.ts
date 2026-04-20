import NextAuth, { type NextAuthConfig } from 'next-auth';
import Google from 'next-auth/providers/google';
import Nodemailer from 'next-auth/providers/nodemailer';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from './prisma';
import { ADMIN_EMAILS } from './constants';

export const authConfig: NextAuthConfig = {
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    ...(process.env.EMAIL_SERVER
      ? [
          Nodemailer({
            server: process.env.EMAIL_SERVER,
            from: process.env.EMAIL_FROM,
          }),
        ]
      : []),
  ],
  callbacks: {
    async session({ session, user }) {
      if (session.user && user) {
        session.user.id = user.id;
        session.user.role = (user as { role?: string }).role ?? 'user';
      }
      return session;
    },
    async signIn({ user }) {
      if (!user.email) return true;
      if (ADMIN_EMAILS.includes(user.email)) {
        try {
          await prisma.user.update({
            where: { email: user.email },
            data: { role: 'admin' },
          });
        } catch {
          // User might not exist yet on first sign-in; adapter creates them.
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
  // `__Host-` prefix requires Secure + Path=/ + no Domain attribute — all of
  // which Auth.js already sets in production. In dev we drop the prefix so
  // cookies still work over http://localhost.
  cookies:
    process.env.NODE_ENV === 'production'
      ? {
          sessionToken: {
            name: '__Host-authjs.session-token',
            options: {
              httpOnly: true,
              sameSite: 'lax',
              path: '/',
              secure: true,
            },
          },
          callbackUrl: {
            name: '__Host-authjs.callback-url',
            options: { sameSite: 'lax', path: '/', secure: true },
          },
          csrfToken: {
            name: '__Host-authjs.csrf-token',
            options: {
              httpOnly: true,
              sameSite: 'lax',
              path: '/',
              secure: true,
            },
          },
        }
      : undefined,
  debug: process.env.NODE_ENV === 'development',
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);

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
