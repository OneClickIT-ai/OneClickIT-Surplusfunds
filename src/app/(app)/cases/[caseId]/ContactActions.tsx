"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const CHANNELS = [
  { key: "CALL", label: "Call" },
  { key: "SMS", label: "SMS" },
  { key: "EMAIL", label: "Email" },
  { key: "MAIL", label: "Mail" },
  { key: "IN_PERSON", label: "In-person" },
] as const;

type Channel = (typeof CHANNELS)[number]["key"];
type Direction = "outbound" | "inbound";

/**
 * Suggested result chips by channel. Tokens match the failure-classifier
 * vocabulary in `modules/outbound/server/follow-up` so picking one of the
 * "no-reach" chips auto-creates a FOLLOW_UP task server-side.
 */
const RESULT_CHIPS: Record<Channel, string[]> = {
  CALL: ["answered", "voicemail", "no_answer", "busy", "wrong_number"],
  SMS: ["delivered", "failed", "wrong_number", "no_response"],
  EMAIL: ["sent", "bounced", "undeliverable", "no_response"],
  MAIL: ["sent", "undeliverable", "returned"],
  IN_PERSON: ["met", "no_answer", "left_note"],
};

/**
 * Quick-log panel for a contact attempt. Sends straight to
 * POST /api/v1/cases/:id/contacts, then refreshes the RSC so the new log
 * appears in the timeline + contact list immediately.
 */
export function ContactActions({ caseId }: { caseId: string }) {
  const router = useRouter();
  const [channel, setChannel] = useState<Channel>("CALL");
  const [direction, setDirection] = useState<Direction>("outbound");
  const [status, setStatus] = useState("");
  const [duration, setDuration] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setFlash(null);
    try {
      const body: Record<string, unknown> = { channel, direction };
      if (status.trim()) body.status = status.trim();
      if (notes.trim()) body.notes = notes.trim();
      const durNum = Number(duration);
      if (duration && Number.isFinite(durNum) && durNum > 0) {
        body.duration = Math.floor(durNum);
      }

      const res = await fetch(`/api/v1/cases/${caseId}/contacts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "log failed");

      setStatus("");
      setDuration("");
      setNotes("");
      setFlash(
        json?.followUpCreated
          ? "Logged. Follow-up task scheduled for tomorrow."
          : "Logged.",
      );
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "log failed");
    } finally {
      setBusy(false);
    }
  }

  // Only Call channels typically care about duration; show it contextually.
  const showDuration = channel === "CALL";
  const chips = RESULT_CHIPS[channel];

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {CHANNELS.map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={() => {
              setChannel(c.key);
              setStatus("");
            }}
            className={`rounded-full px-3 py-1 text-xs ${
              channel === c.key
                ? "bg-black text-white"
                : "border bg-zinc-50 text-zinc-700 hover:bg-zinc-100"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3 text-xs">
        <label className="flex items-center gap-1.5">
          <input
            type="radio"
            checked={direction === "outbound"}
            onChange={() => setDirection("outbound")}
          />
          Outbound
        </label>
        <label className="flex items-center gap-1.5">
          <input
            type="radio"
            checked={direction === "inbound"}
            onChange={() => setDirection("inbound")}
          />
          Inbound
        </label>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <label className="block text-xs">
          <span className="mb-1 block text-zinc-500">Result</span>
          <input
            type="text"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            placeholder={
              channel === "CALL"
                ? "e.g. answered, voicemail"
                : channel === "EMAIL"
                  ? "e.g. sent, bounced"
                  : "e.g. delivered"
            }
            className="w-full rounded-lg border px-2 py-1.5 text-sm"
          />
          <div className="mt-1 flex flex-wrap gap-1">
            {chips.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => setStatus(chip)}
                className={`rounded-full border px-2 py-0.5 text-[10px] ${
                  status === chip
                    ? "border-black bg-black text-white"
                    : "bg-white text-zinc-600 hover:bg-zinc-100"
                }`}
              >
                {chip}
              </button>
            ))}
          </div>
        </label>
        {showDuration && (
          <label className="block text-xs">
            <span className="mb-1 block text-zinc-500">Duration (sec)</span>
            <input
              type="number"
              min={0}
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full rounded-lg border px-2 py-1.5 text-sm"
            />
          </label>
        )}
      </div>

      <label className="block text-xs">
        <span className="mb-1 block text-zinc-500">Notes</span>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="w-full rounded-lg border px-2 py-1.5 text-sm"
          placeholder="What happened? Next step?"
        />
      </label>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-2 text-xs text-red-700">
          {error}
        </div>
      )}
      {flash && !error && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-2 text-xs text-emerald-700">
          {flash}
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={busy}
          className="rounded-lg bg-black px-4 py-1.5 text-xs text-white disabled:opacity-50"
        >
          {busy ? "Logging…" : `Log ${CHANNELS.find((c) => c.key === channel)?.label.toLowerCase()}`}
        </button>
      </div>
    </form>
  );
}
