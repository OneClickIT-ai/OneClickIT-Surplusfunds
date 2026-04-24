import { PrismaAdapter } from '@auth/prisma-adapter';
import { NextAuthOptions } from 'next-auth';
import EmailProvider from 'next-auth/providers/email';
import { prisma } from './prisma';
import { ADMIN_EMAILS } from './constants';

const emailServer = process.env.EMAIL_SERVER ?? (
  process.env.EMAIL_SERVER_HOST
    ? {
        host: process.env.EMAIL_SERVER_HOST,
        port: Number(process.env.EMAIL_SERVER_PORT ?? 465),
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      }
    : undefined
);

if (!emailServer && process.env.NODE_ENV !== 'production') {
  console.warn(
    '[auth] EMAIL_SERVER or EMAIL_SERVER_HOST is not set — magic link sign-in will not work.'
  );
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as NextAuthOptions['adapter'],
  providers: [
    EmailProvider({
      server: emailServer,
      from: process.env.EMAIL_FROM,
      /**
       * Route the magic-link through /auth/verify before the NextAuth
       * callback. This single change makes the token scanner-safe:
       * email prefetchers land on the verify page (which renders a
       * button but does NOT consume the token), while real users click
       * the button and are directed to the actual /api/auth/callback/email
       * endpoint where the session is created.
       */
      sendVerificationRequest: async ({ identifier: email, url, provider }) => {
        const origin = new URL(url).origin;
        const verifyUrl = `${origin}/auth/verify?url=${encodeURIComponent(url)}`;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const nodemailer = await import('nodemailer') as any;
        const transport = nodemailer.createTransport(provider.server);

        await transport.sendMail({
          to: email,
          from: provider.from,
          subject: 'Sign in to SurplusClickIT',
          text: [
            'Sign in to SurplusClickIT',
            '',
            'Click the link below to complete your sign-in:',
            verifyUrl,
            '',
            'This link expires in 24 hours and can only be used once.',
            '',
            "If you didn't request this, you can safely ignore this email.",
          ].join('\n'),
          html: `<!doctype html>
<html lang="en">
<body style="margin:0;padding:32px;background:#f9fafb;font-family:system-ui,sans-serif">
<div style="max-width:480px;margin:auto;background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:36px">
  <h1 style="font-size:20px;font-weight:700;color:#111827;margin:0 0 8px">Sign in to SurplusClickIT</h1>
  <p style="color:#6b7280;margin:0 0 28px;line-height:1.5">
    Click the button below to sign in to your account.<br>
    This link expires in 24 hours and can only be used once.
  </p>
  <a href="${verifyUrl}"
     style="display:inline-block;background:#2563eb;color:#fff;font-weight:600;padding:13px 28px;border-radius:8px;text-decoration:none;font-size:15px">
    Sign in to SurplusClickIT
  </a>
  <p style="color:#9ca3af;font-size:12px;margin:28px 0 0;line-height:1.5">
    If you didn&rsquo;t request this link, you can safely ignore this email.<br>
    Your account will not be affected.
  </p>
</div>
</body>
</html>`,
        });
      },
    }),
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
