import { PrismaAdapter } from '@auth/prisma-adapter';
import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import EmailProvider from 'next-auth/providers/email';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from './prisma';
import { ADMIN_EMAILS } from './constants';

// Dev-mode fallback login. Enabled ONLY when AUTH_DEV_MODE=true AND not in
// production. Lets operators sign in with an email (and optional shared
// password) when Google OAuth credentials are not configured — so the app is
// still testable locally and in staging.
const isDevCredentialsEnabled =
  process.env.AUTH_DEV_MODE === 'true' && process.env.NODE_ENV !== 'production';

const hasGoogleOAuth = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
const hasEmailProvider = Boolean(process.env.EMAIL_SERVER && process.env.EMAIL_FROM);

// Credentials provider requires the JWT session strategy. We flip strategies
// only when dev credentials are on, leaving production on the database
// strategy (unchanged behaviour).
const sessionStrategy: 'database' | 'jwt' = isDevCredentialsEnabled ? 'jwt' : 'database';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as NextAuthOptions['adapter'],
  providers: [
    ...(hasGoogleOAuth
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
          }),
        ]
      : []),
    ...(hasEmailProvider
      ? [
          EmailProvider({
            server: process.env.EMAIL_SERVER,
            from: process.env.EMAIL_FROM,
          }),
        ]
      : []),
    ...(isDevCredentialsEnabled
      ? [
          CredentialsProvider({
            id: 'dev-credentials',
            name: 'Dev login',
            credentials: {
              email: { label: 'Email', type: 'email' },
              password: { label: 'Password', type: 'password' },
            },
            async authorize(creds) {
              const email = creds?.email?.trim().toLowerCase();
              if (!email) return null;

              // If a shared dev password is set, enforce it.
              const expected = process.env.AUTH_DEV_PASSWORD;
              if (expected && creds?.password !== expected) return null;

              const role = ADMIN_EMAILS.includes(email) ? 'admin' : 'user';
              const user = await prisma.user.upsert({
                where: { email },
                update: { role },
                create: { email, role, name: email.split('@')[0] },
              });
              return { id: user.id, email: user.email, name: user.name, role: user.role };
            },
          }),
        ]
      : []),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // Only runs when strategy === 'jwt' (dev mode).
      if (user) {
        token.id = (user as { id: string }).id;
        token.role = (user as { role?: string }).role ?? 'user';
      }
      return token;
    },
    async session({ session, user, token }) {
      if (!session.user) return session;
      if (sessionStrategy === 'jwt' && token) {
        session.user.id = (token.id as string) ?? '';
        session.user.role = (token.role as string) ?? 'user';
      } else if (user) {
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
    error: '/auth/signin',
  },
  session: {
    strategy: sessionStrategy,
  },
  debug: process.env.NODE_ENV === 'development',
};

export const authDiagnostics = {
  hasGoogleOAuth,
  hasEmailProvider,
  isDevCredentialsEnabled,
  hasNextAuthSecret: Boolean(process.env.NEXTAUTH_SECRET),
  hasNextAuthUrl: Boolean(process.env.NEXTAUTH_URL),
  hasDatabaseUrl: Boolean(process.env.POSTGRES_URL),
  sessionStrategy,
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
