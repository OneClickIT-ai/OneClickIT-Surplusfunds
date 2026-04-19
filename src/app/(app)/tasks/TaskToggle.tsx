"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function TaskToggle({
  taskId,
  completed,
}: {
  taskId: string;
  completed: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function toggle(e: React.ChangeEvent<HTMLInputElement>) {
    const next = e.target.checked;
    setPending(true);
    try {
      await fetch(`/api/v1/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: next }),
      });
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <input
      type="checkbox"
      checked={completed}
      disabled={pending}
      onChange={toggle}
      className="mt-1"
    />
  );
}
