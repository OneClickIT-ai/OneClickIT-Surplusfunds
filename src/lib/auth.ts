import { PrismaAdapter } from '@auth/prisma-adapter';
import { NextAuthOptions } from 'next-auth';
import EmailProvider from 'next-auth/providers/email';
import { prisma } from './prisma';
import { ADMIN_EMAILS } from './constants';

async function sendVerificationRequest({
  identifier: email,
  url,
}: {
  identifier: string;
  url: string;
  provider: { server: unknown; from: string };
}) {
  const apiKey = process.env.EMAIL_SERVER_PASSWORD;
  const from = process.env.EMAIL_FROM ?? 'noreply@oneclickit.xyz';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Sign in to SurplusClickIT</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:#1d4ed8;padding:32px 40px;text-align:center;">
              <p style="margin:0;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">SurplusClickIT</p>
              <p style="margin:4px 0 0;font-size:13px;color:#bfdbfe;">Surplus Funds Intelligence Platform</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 32px;">
              <h1 style="margin:0 0 8px;font-size:20px;font-weight:600;color:#111827;">Your magic sign-in link</h1>
              <p style="margin:0 0 28px;font-size:15px;color:#6b7280;line-height:1.6;">
                Click the button below to sign in to your SurplusClickIT account. No password needed — this link expires in <strong>24 hours</strong> and works only once.
              </p>

              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0" style="margin:0 auto 28px;">
                <tr>
                  <td style="background:#1d4ed8;border-radius:8px;">
                    <a href="${url}" target="_blank"
                      style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;letter-spacing:0.1px;">
                      Sign in to SurplusClickIT
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 8px;font-size:13px;color:#9ca3af;">Or copy and paste this URL into your browser:</p>
              <p style="margin:0;font-size:12px;color:#6b7280;word-break:break-all;background:#f9fafb;padding:10px 12px;border-radius:6px;border:1px solid #e5e7eb;">${url}</p>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:0 40px;">
              <hr style="border:none;border-top:1px solid #e5e7eb;margin:0;" />
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;text-align:center;">
              <p style="margin:0 0 4px;font-size:12px;color:#9ca3af;">
                If you didn&rsquo;t request this link, you can safely ignore this email.
              </p>
              <p style="margin:0;font-size:12px;color:#9ca3af;">
                &copy; ${new Date().getFullYear()} OneClickIT &mdash; <a href="https://oneclickit.xyz/privacy" style="color:#9ca3af;">Privacy Policy</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from,
      to: [email],
      subject: 'Your sign-in link for SurplusClickIT',
      html,
      text: `Sign in to SurplusClickIT\n\nClick this link to sign in (expires in 24 hours):\n\n${url}\n\nIf you did not request this, ignore this email.`,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Resend error ${res.status}: ${body}`);
  }
}

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
      sendVerificationRequest,
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
