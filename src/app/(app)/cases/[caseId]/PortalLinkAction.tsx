"use client";

import { useState } from "react";

/**
 * Issue a portal link on demand. Keeps the link in component state and
 * offers a one-click copy. Does not persist the URL in the page beyond
 * the current session — any stale tab still has whatever was generated
 * during that render, which is fine since rotating the link explicitly
 * revokes the old one server-side.
 */
export function PortalLinkAction({ caseId }: { caseId: string }) {
  const [busy, setBusy] = useState(false);
  const [url, setUrl] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function generate() {
    setBusy(true);
    setError(null);
    setCopied(false);
    try {
      const res = await fetch(`/api/v1/cases/${caseId}/portal-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "failed");
      setUrl(json.data.url);
      setExpiresAt(json.data.expiresAt);
    } catch (e) {
      setError(e instanceof Error ? e.message : "failed");
    } finally {
      setBusy(false);
    }
  }

  async function copy() {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked; user can copy manually */
    }
  }

  return (
    <div className="space-y-2">
      <button
        onClick={() => void generate()}
        disabled={busy}
        className="rounded-lg border px-3 py-1.5 text-xs hover:bg-zinc-100 disabled:opacity-50"
      >
        {busy
          ? "Generating…"
          : url
            ? "Rotate portal link"
            : "Generate portal link"}
      </button>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-2 text-xs text-red-700">
          {error}
        </div>
      )}

      {url && (
        <div className="rounded-lg border bg-zinc-50 p-3 text-xs space-y-2">
          <div className="break-all font-mono">{url}</div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => void copy()}
              className="rounded-md border bg-white px-2 py-1 text-xs hover:bg-zinc-100"
            >
              {copied ? "Copied ✓" : "Copy link"}
            </button>
            {expiresAt && (
              <span className="text-zinc-500">
                Expires {new Date(expiresAt).toLocaleDateString()}
              </span>
            )}
          </div>
          <p className="text-zinc-500">
            Rotating this link immediately revokes the previous one.
          </p>
        </div>
      )}
    </div>
  );
}
