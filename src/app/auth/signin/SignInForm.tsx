'use client';
import { signIn } from 'next-auth/react';
import { useState, type FormEvent } from 'react';
import Button from '@/components/ui/Button';

type Props = {
  callbackUrl: string;
  hasGoogle: boolean;
  hasEmail: boolean;
  hasDevCredentials: boolean;
};

export default function SignInForm({ callbackUrl, hasGoogle, hasEmail, hasDevCredentials }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function onEmailLink(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const res = await signIn('email', { email, callbackUrl, redirect: false });
    setSubmitting(false);
    if (res?.ok) setEmailSent(true);
  }

  async function onDevLogin(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    await signIn('dev-credentials', { email, password, callbackUrl });
    setSubmitting(false);
  }

  return (
    <div className="space-y-4">
      {hasGoogle && (
        <Button
          className="w-full"
          variant="primary"
          onClick={() => signIn('google', { callbackUrl })}
        >
          Sign in with Google
        </Button>
      )}

      {hasEmail && (
        <form onSubmit={onEmailLink} className="space-y-2">
          <label className="block text-xs font-medium text-gray-600">Email magic link</label>
          <input
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
          <Button type="submit" variant="outline" className="w-full" loading={submitting}>
            Email me a sign-in link
          </Button>
          {emailSent && (
            <p className="text-xs text-green-600">Check your inbox for a sign-in link.</p>
          )}
        </form>
      )}

      {hasDevCredentials && (
        <form onSubmit={onDevLogin} className="space-y-2 rounded-md border border-dashed border-amber-300 bg-amber-50/50 p-3">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-medium text-amber-800">Dev login (non-prod)</label>
            <span className="text-[10px] uppercase tracking-wide text-amber-700">AUTH_DEV_MODE</span>
          </div>
          <input
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="dev@example.com"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="AUTH_DEV_PASSWORD (if set)"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
          <Button type="submit" variant="secondary" className="w-full" loading={submitting}>
            Dev sign in
          </Button>
        </form>
      )}
    </div>
  );
}
