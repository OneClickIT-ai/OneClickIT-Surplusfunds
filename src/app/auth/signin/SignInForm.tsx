'use client';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import Button from '@/components/ui/Button';

type Props = {
  callbackUrl: string;
  hasGoogle: boolean;
  hasEmail: boolean;
  hasDevCredentials: boolean;
};

export default function SignInForm({ callbackUrl, hasGoogle, hasEmail, hasDevCredentials }: Props) {
  const router = useRouter();

  const [magicEmail, setMagicEmail] = useState('');
  const [magicSubmitting, setMagicSubmitting] = useState(false);
  const [magicSent, setMagicSent] = useState(false);
  const [magicError, setMagicError] = useState<string | null>(null);

  const [devEmail, setDevEmail] = useState('');
  const [devPassword, setDevPassword] = useState('');
  const [devSubmitting, setDevSubmitting] = useState(false);
  const [devError, setDevError] = useState<string | null>(null);

  async function onEmailLink(e: FormEvent) {
    e.preventDefault();
    setMagicError(null);
    setMagicSent(false);
    setMagicSubmitting(true);
    const res = await signIn('email', { email: magicEmail, callbackUrl, redirect: false });
    setMagicSubmitting(false);
    if (res?.ok) {
      setMagicSent(true);
    } else {
      setMagicError(res?.error ?? 'Could not send sign-in link. Please try again.');
    }
  }

  async function onDevLogin(e: FormEvent) {
    e.preventDefault();
    setDevError(null);
    setDevSubmitting(true);
    const res = await signIn('dev-credentials', {
      email: devEmail,
      password: devPassword,
      callbackUrl,
      redirect: false,
    });
    setDevSubmitting(false);
    if (res?.ok) {
      router.push(res.url ?? callbackUrl);
      router.refresh();
    } else {
      setDevError('Invalid email or dev password.');
    }
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
          <label className="block text-xs font-medium text-gray-600" htmlFor="magic-email">
            Email magic link
          </label>
          <input
            id="magic-email"
            type="email"
            required
            value={magicEmail}
            onChange={e => setMagicEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
          <Button type="submit" variant="outline" className="w-full" loading={magicSubmitting}>
            Email me a sign-in link
          </Button>
          {magicSent && (
            <p className="text-xs text-green-600">Check your inbox for a sign-in link.</p>
          )}
          {magicError && <p className="text-xs text-red-600">{magicError}</p>}
        </form>
      )}

      {hasDevCredentials && (
        <form
          onSubmit={onDevLogin}
          className="space-y-2 rounded-md border border-dashed border-amber-300 bg-amber-50/50 p-3"
        >
          <div className="flex items-center justify-between">
            <label
              htmlFor="dev-email"
              className="block text-xs font-medium text-amber-800"
            >
              Dev login (non-prod)
            </label>
            <span className="text-[10px] uppercase tracking-wide text-amber-700">AUTH_DEV_MODE</span>
          </div>
          <input
            id="dev-email"
            type="email"
            required
            value={devEmail}
            onChange={e => setDevEmail(e.target.value)}
            placeholder="dev@example.com"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
          <input
            id="dev-password"
            type="password"
            required
            value={devPassword}
            onChange={e => setDevPassword(e.target.value)}
            placeholder="AUTH_DEV_PASSWORD"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
          <Button type="submit" variant="secondary" className="w-full" loading={devSubmitting}>
            Dev sign in
          </Button>
          {devError && <p className="text-xs text-red-600">{devError}</p>}
        </form>
      )}
    </div>
  );
}
