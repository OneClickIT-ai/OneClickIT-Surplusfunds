"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * Typed-name signature widget. v1 — no canvas drawing; just a confirmation
 * that the claimant typed their name. The server stamps the timestamp +
 * provenance into the agreement's rendered text for the audit trail.
 */
export function SignForm({
  token,
  agreementId,
  defaultName,
}: {
  token: string;
  agreementId: string;
  defaultName: string;
}) {
  const router = useRouter();
  const [name, setName] = useState(defaultName);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/portal/${token}/sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agreementId, typedName: name }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json.error ?? "sign failed");
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "sign failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <label className="block text-sm">
        <span className="mb-1 block font-medium">
          Type your full legal name to sign
        </span>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          minLength={2}
          maxLength={200}
          className="w-full rounded-lg border px-3 py-2"
          placeholder="e.g. Jane Q. Public"
        />
      </label>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={busy || name.trim().length < 2}
        className="rounded-lg bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
      >
        {busy ? "Signing…" : "Sign agreement"}
      </button>

      <p className="text-xs text-zinc-500">
        By typing your name and clicking Sign, you agree this counts as your
        electronic signature on this agreement. A timestamped audit record is
        attached to the document.
      </p>
    </form>
  );
}
