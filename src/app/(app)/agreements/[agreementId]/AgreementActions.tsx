"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AgreementActions({
  agreementId,
  canSend,
  canMarkSigned,
  eSignUrl,
}: {
  agreementId: string;
  canSend: boolean;
  canMarkSigned: boolean;
  eSignUrl: string | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(path: "send" | "sign") {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/agreements/${agreementId}/${path}`, {
        method: "POST",
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? "request failed");
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "request failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => void run("send")}
          disabled={busy || !canSend}
          className="rounded-lg bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          {busy ? "Working…" : "Send for signature"}
        </button>
        <button
          onClick={() => void run("sign")}
          disabled={busy || !canMarkSigned}
          className="rounded-lg border px-4 py-2 text-sm hover:bg-zinc-50 disabled:opacity-50"
        >
          Mark signed (admin)
        </button>
        <a
          href={`/api/v1/agreements/${agreementId}/pdf`}
          target="_blank"
          rel="noreferrer"
          className="rounded-lg border px-4 py-2 text-sm hover:bg-zinc-50"
        >
          Download document
        </a>
        {eSignUrl && (
          <a
            href={eSignUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-lg border px-4 py-2 text-sm hover:bg-zinc-50"
          >
            Open signing link
          </a>
        )}
      </div>
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
    </div>
  );
}
