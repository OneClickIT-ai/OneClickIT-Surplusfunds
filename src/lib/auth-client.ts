"use client";

import { useUser, useClerk } from "@clerk/nextjs";

/**
 * `useSession`-shaped shim over Clerk's `useUser`. Returns the same
 * `{ data, status }` tuple next-auth callsites already expect, so pricing /
 * calculator / header menus don't need to change during the migration.
 *
 * Caveat: `data.user.id` is Clerk's userId (e.g. `user_abc…`), not our
 * local `User.id` cuid. None of the current client callsites treat it as
 * a DB key — they use it only for presence / rendering.
 *
 * `role` is sourced from Clerk `publicMetadata.role` when present and falls
 * back to `"user"`. Admin sync into publicMetadata still needs to land in
 * Phase 2; until then, Pro gating on the client is best-effort and the real
 * enforcement lives server-side in `getCurrentActor`.
 */
export function useSession(): {
  data: { user: SessionUser } | null;
  status: "loading" | "authenticated" | "unauthenticated";
} {
  const { isLoaded, isSignedIn, user } = useUser();
  if (!isLoaded) return { data: null, status: "loading" };
  if (!isSignedIn || !user) return { data: null, status: "unauthenticated" };

  const metadataRole =
    typeof user.publicMetadata?.role === "string"
      ? (user.publicMetadata.role as string)
      : undefined;

  return {
    data: {
      user: {
        id: user.id,
        email: user.primaryEmailAddress?.emailAddress ?? "",
        name: user.fullName ?? user.username ?? null,
        image: user.imageUrl ?? null,
        role: metadataRole ?? "user",
      },
    },
    status: "authenticated",
  };
}

/**
 * Swap-in for `next-auth/react`'s `signOut`. Clerk exposes `signOut` on its
 * hook API; we thin-wrap it so existing callsites like
 * `signOut({ callbackUrl: "/" })` keep their signature.
 */
export function useSignOut() {
  const clerk = useClerk();
  return async function signOut(opts: { callbackUrl?: string } = {}) {
    await clerk.signOut();
    if (typeof window !== "undefined") {
      window.location.href = opts.callbackUrl ?? "/";
    }
  };
}

/**
 * Swap-in for `next-auth/react`'s top-level `signIn(provider, { callbackUrl })`.
 * With Clerk we just bounce to the custom sign-in page with a redirect_url.
 */
export function signIn(
  _provider: string = "google",
  opts: { callbackUrl?: string } = {},
): void {
  if (typeof window === "undefined") return;
  const redirect = opts.callbackUrl ?? "/dashboard";
  window.location.href = `/sign-in?redirect_url=${encodeURIComponent(redirect)}`;
}

export interface SessionUser {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  role: string;
}
