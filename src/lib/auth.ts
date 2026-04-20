import { auth, currentUser } from '@clerk/nextjs/server';

import { prisma } from './prisma';
import { ADMIN_EMAILS } from './constants';

/**
 * Canonical session shape the rest of the app consumes. Preserves the
 * `{ user: { id, role, … } }` layout the codebase grew under NextAuth so
 * callsites can migrate mechanically.
 *
 * `user.id` is our local `User.id` (cuid), NOT Clerk's userId — every
 * foreign key in the DB (Claim.userId, Task.userId, ContactLog.userId, …)
 * points at User.id, so we resolve Clerk → local once per request.
 */
export interface ActorSession {
  user: {
    id: string;
    clerkId: string;
    email: string;
    name: string | null;
    image: string | null;
    role: string;
  };
}

/**
 * Load the current Clerk session and reconcile it with the local `User` row.
 *
 * First visit for a Clerk user: we upsert a User record keyed by `clerkId`,
 * hydrating email/name/image from Clerk. Subsequent visits: we look the row
 * up by `clerkId` directly. Admin elevation continues to work via
 * ADMIN_EMAILS so operators can promote themselves just by logging in.
 *
 * Returns `null` when no Clerk session is present — every callsite should
 * handle this as "unauthenticated" exactly like `getServerSession` used to.
 */
export async function getCurrentActor(): Promise<ActorSession | null> {
  const { userId: clerkId } = await auth();
  if (!clerkId) return null;

  // Fast path: row already exists.
  const existing = await prisma.user.findUnique({ where: { clerkId } });
  if (existing) {
    return toSession(existing);
  }

  // First sign-in for this Clerk user — pull profile from Clerk and provision.
  const profile = await currentUser();
  const email =
    profile?.primaryEmailAddress?.emailAddress ??
    profile?.emailAddresses?.[0]?.emailAddress ??
    null;
  // Clerk is configured to require an email identifier, so a missing email
  // here points at a provisioning bug or a Clerk outage. Refuse to fabricate
  // a synthetic placeholder — that would fork future sign-ins into a row
  // that can never be reconciled with the real address once it arrives.
  if (!email) {
    throw new Error(
      `Clerk user ${clerkId} has no email; cannot provision local User row.`,
    );
  }
  const name =
    [profile?.firstName, profile?.lastName].filter(Boolean).join(' ').trim() ||
    profile?.username ||
    null;
  const image = profile?.imageUrl ?? null;
  const isAdmin = !!email && ADMIN_EMAILS.includes(email);

  // An older account with the same email may exist from NextAuth days.
  // Prefer linking over duplicating — keep existing FKs intact.
  const user = await prisma.user.upsert({
    where: { email },
    create: {
      clerkId,
      email,
      name,
      image,
      role: isAdmin ? 'admin' : 'user',
    },
    update: {
      clerkId,
      name: name ?? undefined,
      image: image ?? undefined,
      ...(isAdmin ? { role: 'admin' } : {}),
    },
  });

  return toSession(user);
}

/**
 * Drop-in replacement for `getServerSession(authOptions)`. Kept for the
 * transition: most callsites import it straight from this module, so swap
 * `import { getServerSession } from 'next-auth'` →
 * `import { getServerSession } from '@/lib/auth'` and the `session.user.id`
 * access pattern continues to work unchanged.
 *
 * Accepts and ignores an arg so that existing
 * `getServerSession(authOptions)` calls keep compiling during the migration
 * window without touching every callsite.
 */
export async function getServerSession(_?: unknown): Promise<ActorSession | null> {
  return getCurrentActor();
}

// Compatibility export — a few files still import `authOptions`. It's inert
// now; remove once those callsites are cleaned up.
export const authOptions = {} as const;

function toSession(user: {
  id: string;
  clerkId: string | null;
  email: string;
  name: string | null;
  image: string | null;
  role: string;
}): ActorSession {
  // getCurrentActor always resolves via Clerk first and either finds or
  // upserts a row stamped with clerkId, so a null here means someone
  // bypassed that path (stale test fixture, migration drift, etc.). Fail
  // loudly rather than hand callers an empty-string identity they'd treat
  // as "not logged in via Clerk."
  if (!user.clerkId) {
    throw new Error(
      `User ${user.id} has no clerkId; refusing to build an ActorSession.`,
    );
  }
  return {
    user: {
      id: user.id,
      clerkId: user.clerkId,
      email: user.email,
      name: user.name,
      image: user.image,
      role: user.role,
    },
  };
}
