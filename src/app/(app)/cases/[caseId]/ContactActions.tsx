"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { CONTACT_STATUS_OPTIONS } from "@/modules/outbound/follow-up";

const CHANNELS = [
  { key: "CALL", label: "Call" },
  { key: "SMS", label: "SMS" },
  { key: "EMAIL", label: "Email" },
  { key: "MAIL", label: "Mail" },
  { key: "IN_PERSON", label: "In-person" },
] as const;

type Channel = (typeof CHANNELS)[number]["key"];
type Direction = "outbound" | "inbound";
type Mode = "log" | "send";

/**
 * Quick-log panel for contact attempts. Two modes:
 *
 * 1. "Log only" — just records what the operator did, no provider call.
 * 2. "Send" (SMS/EMAIL only) — actually dispatches via Twilio/Resend
 *    through the /contacts/send endpoint, which writes a ContactLog row
 *    regardless of success and auto-schedules a follow-up task on failure.
 *
 * One refresh at the end so the new log and any seeded task show up in
 * the timeline immediately.
 */
export function ContactActions({ caseId }: { caseId: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("log");
  const [channel, setChannel] = useState<Channel>("CALL");
  const [direction, setDirection] = useState<Direction>("outbound");
  const [status, setStatus] = useState("");
  const [duration, setDuration] = useState("");
  const [notes, setNotes] = useState("");
  const [subject, setSubject] = useState("");
  const [messageBody, setMessageBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const canSend = channel === "SMS" || channel === "EMAIL";
  const effectiveMode: Mode = canSend ? mode : "log";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setToast(null);

    try {
      if (effectiveMode === "send") {
        await submitSend();
      } else {
        await submitLog();
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "request failed");
    } finally {
      setBusy(false);
    }
  }

  async function submitLog() {
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
    setToast(
      json.followUpTaskCreated ? "Follow-up task scheduled" : "Contact logged",
    );
  }

  async function submitSend() {
    if (!messageBody.trim()) {
      throw new Error("Message body is required");
    }
    if (channel === "EMAIL" && !subject.trim()) {
      throw new Error("Subject is required for email");
    }
    const body: Record<string, unknown> = {
      channel,
      body: messageBody.trim(),
    };
    if (channel === "EMAIL") body.subject = subject.trim();

    const res = await fetch(`/api/v1/cases/${caseId}/contacts/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    if (res.status === 400 && json.error === "no_claimant") {
      throw new Error(json.message ?? "No claimant is linked to this case yet.");
    }
    if (res.status === 400 && json.error === "missing_contact") {
      throw new Error(json.message ?? "Claimant has no contact info on file.");
    }
    if (res.status === 429) {
      throw new Error(json.message ?? "Rate limited — slow down.");
    }

    // 502 means we logged but provider rejected. Surface as warning, not error,
    // so operators know the log row exists and a follow-up was scheduled.
    if (!res.ok && res.status !== 502) {
      throw new Error(json.error ?? "send failed");
    }

    setMessageBody("");
    setSubject("");
    if (json.sent) {
      setToast(
        channel === "SMS" ? "SMS sent" : "Email sent",
      );
    } else {
      const reason = json.providerError ?? "provider error";
      const tail = json.followUpTaskCreated ? " · follow-up scheduled" : "";
      setToast(`Send failed (${reason}) — logged${tail}`);
    }
  }

  function pickChannel(next: Channel) {
    setChannel(next);
    // Reset status so stale options from the previous channel don't stick.
    setStatus("");
  }

  const showDuration = channel === "CALL";
  const statusOptions = CONTACT_STATUS_OPTIONS[channel] ?? [];

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {CHANNELS.map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={() => pickChannel(c.key)}
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

      {canSend && (
        <div className="flex gap-1 text-xs">
          <button
            type="button"
            onClick={() => setMode("log")}
            className={`rounded-full px-3 py-1 ${
              effectiveMode === "log"
                ? "bg-zinc-900 text-white"
                : "border bg-white text-zinc-600 hover:bg-zinc-50"
            }`}
          >
            Log only
          </button>
          <button
            type="button"
            onClick={() => setMode("send")}
            className={`rounded-full px-3 py-1 ${
              effectiveMode === "send"
                ? "bg-zinc-900 text-white"
                : "border bg-white text-zinc-600 hover:bg-zinc-50"
            }`}
          >
            Send {channel === "SMS" ? "SMS" : "email"}
          </button>
        </div>
      )}

      {effectiveMode === "log" ? (
        <>
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

          <div className="flex flex-wrap gap-1.5">
            {statusOptions.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setStatus(opt === status ? "" : opt)}
                className={`rounded-full px-2.5 py-0.5 text-[11px] ${
                  status === opt
                    ? "bg-zinc-900 text-white"
                    : "border bg-white text-zinc-600 hover:bg-zinc-50"
                }`}
              >
                {opt.replace(/_/g, " ")}
              </button>
            ))}
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <label className="block text-xs">
              <span className="mb-1 block text-zinc-500">Result</span>
              <input
                type="text"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                placeholder="custom result…"
                className="w-full rounded-lg border px-2 py-1.5 text-sm"
              />
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
        </>
      ) : (
        <>
          {channel === "EMAIL" && (
            <label className="block text-xs">
              <span className="mb-1 block text-zinc-500">Subject</span>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                maxLength={200}
                className="w-full rounded-lg border px-2 py-1.5 text-sm"
                placeholder="Regarding your surplus claim"
              />
            </label>
          )}
          <label className="block text-xs">
            <span className="mb-1 block text-zinc-500">
              Message {channel === "SMS" ? "(≤ 1600 chars)" : ""}
            </span>
            <textarea
              value={messageBody}
              onChange={(e) => setMessageBody(e.target.value)}
              rows={channel === "SMS" ? 3 : 6}
              maxLength={1600}
              className="w-full rounded-lg border px-2 py-1.5 text-sm"
              placeholder="Hi, just following up on your claim…"
            />
            <span className="mt-1 block text-right text-[10px] text-zinc-400">
              {messageBody.length}/1600
            </span>
          </label>
          <p className="text-[11px] text-zinc-500">
            The message is sent via {channel === "SMS" ? "Twilio" : "Resend"} and
            logged automatically. If the provider rejects the send, a follow-up
            task is scheduled.
          </p>
        </>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-2 text-xs text-red-700">
          {error}
        </div>
      )}
      {toast && !error && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-2 text-xs text-emerald-700">
          {toast}
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={busy}
          className="rounded-lg bg-black px-4 py-1.5 text-xs text-white disabled:opacity-50"
        >
          {busy
            ? effectiveMode === "send"
              ? "Sending…"
              : "Logging…"
            : effectiveMode === "send"
              ? `Send ${channel === "SMS" ? "SMS" : "email"}`
              : `Log ${CHANNELS.find((c) => c.key === channel)?.label.toLowerCase()}`}
        </button>
      </div>
    </form>
  );
}
