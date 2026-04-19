"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const OPTIONS = [
  "research",
  "contacted",
  "docs_gathering",
  "filed",
  "approved",
  "paid",
  "denied",
  "court_petition",
  "hearing_scheduled",
];

export function StatusUpdater({
  caseId,
  current,
}: {
  caseId: string;
  current: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState(current);
  const [busy, setBusy] = useState(false);

  async function update() {
    if (value === current) return;
    setBusy(true);
    try {
      await fetch(`/api/v1/cases/${caseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: value }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex gap-2">
      <select
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="rounded-lg border px-3 py-2 text-sm"
      >
        {OPTIONS.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      <button
        onClick={() => void update()}
        disabled={busy || value === current}
        className="rounded-lg bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
      >
        {busy ? "…" : "Update"}
      </button>
    </div>
  );
}
