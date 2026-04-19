"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * Client-only mutation button. Keeps the list page as a server component
 * while still allowing an inline "Convert to Case" action.
 */
export function ConvertButton({ leadId }: { leadId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function convert() {
    setBusy(true);
    try {
      const res = await fetch(`/api/v1/leads/${leadId}/convert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        const json = await res.json();
        router.push(`/cases/${json.data.id}`);
        return;
      }
      if (res.status === 409) {
        const json = await res.json();
        if (json.existingClaimId) {
          router.push(`/cases/${json.existingClaimId}`);
          return;
        }
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={() => void convert()}
      disabled={busy}
      className="rounded-lg border px-3 py-1.5 text-xs hover:bg-zinc-100 disabled:opacity-50"
    >
      {busy ? "…" : "Convert to Case"}
    </button>
  );
}
