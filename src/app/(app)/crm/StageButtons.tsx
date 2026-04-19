"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function StageButtons({
  caseId,
  currentStatus,
  options,
}: {
  caseId: string;
  currentStatus: string;
  options: Array<{ key: string; label: string }>;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function move(nextStatus: string) {
    setBusy(true);
    try {
      await fetch(`/api/v1/cases/${caseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {options
        .filter((c) => c.key !== currentStatus)
        .slice(0, 2)
        .map((next) => (
          <button
            key={next.key}
            onClick={() => void move(next.key)}
            disabled={busy}
            className="rounded-lg border px-2 py-1 text-xs hover:bg-zinc-100 disabled:opacity-50"
          >
            Move to {next.label}
          </button>
        ))}
    </>
  );
}
