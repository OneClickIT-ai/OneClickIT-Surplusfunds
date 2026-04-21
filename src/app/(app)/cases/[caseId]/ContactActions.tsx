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
 * Contact panel for a case. Two modes:
 *
 *  - Log only — every channel. Just records what happened, already in prod.
 *  - Send + log — SMS / EMAIL only. Fires the message through Twilio/Resend
 *    (or a dry-run if unconfigured), then writes the audit log. If the send
 *    fails we still land a log row and the server auto-seeds a follow-up.
 */
export function ContactActions({ caseId }: { caseId: string }) {
  const router = useRouter();
  const [channel, setChannel] = useState<Channel>("CALL");
  const [mode, setMode] = useState<Mode>("log");
  const [direction, setDirection] = useState<Direction>("outbound");
  const [status, setStatus] = useState("");
  const [duration, setDuration] = useState("");
  const [notes, setNotes] = useState("");
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const canSend = channel === "SMS" || channel === "EMAIL";
  const effectiveMode: Mode = canSend ? mode : "log";

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
    return json;
  }

  async function submitSend() {
    const trimmedBody = notes.trim();
    if (!trimmedBody) {
      throw new Error("message body is required");
    }
    const body: Record<string, unknown> = {
      channel,
      body: trimmedBody,
    };
    if (to.trim()) body.to = to.trim();
    if (channel === "EMAIL" && subject.trim()) body.subject = subject.trim();

    const res = await fetch(`/api/v1/cases/${caseId}/contacts/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error ?? "send failed");
    return json;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setToast(null);
    try {
      const json =
        effectiveMode === "send" ? await submitSend() : await submitLog();

      setStatus("");
      setDuration("");
      setNotes("");
      setSubject("");
      setTo("");

      if (effectiveMode === "send") {
        const send = json.send as
          | { status?: string; providerStatus?: string }
          | undefined;
        if (send?.status === "dry_run") {
          setToast("Logged (provider not configured — dry run)");
        } else if (send?.status === "failed") {
          setToast(
            json.followUpTaskCreated
              ? "Send failed — follow-up scheduled"
              : "Send failed",
          );
        } else {
          setToast(
            json.followUpTaskCreated
              ? "Sent and follow-up scheduled"
              : "Sent and logged",
          );
        }
      } else if (json.followUpTaskCreated) {
        setToast("Follow-up task scheduled");
      } else {
        setToast("Contact logged");
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "request failed");
    } finally {
      setBusy(false);
    }
  }

  function pickChannel(next: Channel) {
    setChannel(next);
    // Reset status so stale options from the previous channel don't stick.
    setStatus("");
    // "Send" only supports SMS/EMAIL — snap back to log for other channels.
    if (next !== "SMS" && next !== "EMAIL") setMode("log");
  }

  const showDuration = channel === "CALL" && effectiveMode === "log";
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
        <div className="flex items-center gap-3 text-xs">
          <label className="flex items-center gap-1.5">
            <input
              type="radio"
              checked={mode === "log"}
              onChange={() => setMode("log")}
            />
            Log only
          </label>
          <label className="flex items-center gap-1.5">
            <input
              type="radio"
              checked={mode === "send"}
              onChange={() => setMode("send")}
            />
            Send + log
          </label>
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
        </>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          <label className="block text-xs sm:col-span-2">
            <span className="mb-1 block text-zinc-500">
              Send to{" "}
              <span className="text-zinc-400">
                (optional — falls back to claimant {channel === "SMS" ? "phone" : "email"})
              </span>
            </span>
            <input
              type={channel === "SMS" ? "tel" : "email"}
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder={channel === "SMS" ? "+15551234567" : "name@example.com"}
              className="w-full rounded-lg border px-2 py-1.5 text-sm"
            />
          </label>
          {channel === "EMAIL" && (
            <label className="block text-xs sm:col-span-2">
              <span className="mb-1 block text-zinc-500">Subject</span>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Regarding your case"
                className="w-full rounded-lg border px-2 py-1.5 text-sm"
              />
            </label>
          )}
        </div>
      )}

      <label className="block text-xs">
        <span className="mb-1 block text-zinc-500">
          {effectiveMode === "send" ? "Message" : "Notes"}
        </span>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          required={effectiveMode === "send"}
          className="w-full rounded-lg border px-2 py-1.5 text-sm"
          placeholder={
            effectiveMode === "send"
              ? "What would you like to send?"
              : "What happened? Next step?"
          }
        />
      </label>

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
          disabled={busy || (effectiveMode === "send" && !notes.trim())}
          className="rounded-lg bg-black px-4 py-1.5 text-xs text-white disabled:opacity-50"
        >
          {busy
            ? effectiveMode === "send"
              ? "Sending…"
              : "Logging…"
            : effectiveMode === "send"
              ? `Send ${channel.toLowerCase()}`
              : `Log ${CHANNELS.find((c) => c.key === channel)?.label.toLowerCase()}`}
        </button>
      </div>
    </form>
  );
}
