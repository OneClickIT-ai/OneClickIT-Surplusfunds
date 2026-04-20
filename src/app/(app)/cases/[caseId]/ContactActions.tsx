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

interface ContactActionsProps {
  caseId: string;
  claimantPhone?: string | null;
  claimantEmail?: string | null;
}

/**
 * Quick-log + outbound-send panel for a case. Two modes:
 *
 * 1. **Log** — operator manually records something that happened off-platform.
 *    Hits POST /api/v1/cases/:id/contacts.
 * 2. **Send** — only available for SMS/EMAIL. Operator types a message; we
 *    relay through Twilio/Resend and the server records the result regardless
 *    of provider success. Hits POST /api/v1/cases/:id/contacts/send.
 *
 * Either way, if the result indicates a failed contact attempt, the server
 * auto-seeds a follow-up task; we surface that as a toast.
 */
export function ContactActions({
  caseId,
  claimantPhone,
  claimantEmail,
}: ContactActionsProps) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("log");
  const [channel, setChannel] = useState<Channel>("CALL");
  const [direction, setDirection] = useState<Direction>("outbound");
  const [status, setStatus] = useState("");
  const [duration, setDuration] = useState("");
  const [notes, setNotes] = useState("");
  const [recipient, setRecipient] = useState("");
  const [subject, setSubject] = useState("");
  const [messageBody, setMessageBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const sendCapable = channel === "SMS" || channel === "EMAIL";
  const effectiveMode: Mode = sendCapable ? mode : "log";
  const recipientFallback =
    channel === "SMS"
      ? (claimantPhone ?? "")
      : channel === "EMAIL"
        ? (claimantEmail ?? "")
        : "";
  const recipientPlaceholder =
    channel === "SMS" ? "+15551234567" : "name@example.com";

  function pickChannel(next: Channel) {
    setChannel(next);
    // Reset status so stale options from the previous channel don't stick.
    setStatus("");
    setRecipient("");
    setSubject("");
    if (next !== "SMS" && next !== "EMAIL") {
      setMode("log");
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
    return {
      followUpTaskCreated: !!json.followUpTaskCreated,
      providerOk: true,
      successMessage: "Contact logged",
    };
  }

  async function submitSend() {
    const trimmedTo = recipient.trim() || recipientFallback;
    if (!trimmedTo) {
      throw new Error(
        channel === "SMS"
          ? "no phone on file — enter a recipient"
          : "no email on file — enter a recipient",
      );
    }
    if (!messageBody.trim()) throw new Error("message body is required");
    if (channel === "EMAIL" && !subject.trim())
      throw new Error("email requires a subject");

    const payload: Record<string, unknown> = {
      channel,
      to: trimmedTo,
      body: messageBody.trim(),
    };
    if (channel === "EMAIL") payload.subject = subject.trim();
    if (notes.trim()) payload.notes = notes.trim();

    const res = await fetch(`/api/v1/cases/${caseId}/contacts/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json().catch(() => ({}));
    // 502 means the provider failed but we still wrote a ContactLog — surface
    // the provider error, but treat the audit record as authoritative.
    if (!res.ok && res.status !== 502) {
      throw new Error(json.error ?? "send failed");
    }
    const providerOk = !!json.provider?.ok;
    return {
      followUpTaskCreated: !!json.followUpTaskCreated,
      providerOk,
      successMessage: providerOk
        ? channel === "SMS"
          ? "SMS sent"
          : "Email sent"
        : `Send failed (${json.provider?.status ?? "failed"}) — logged for follow-up`,
    };
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setToast(null);
    try {
      const result =
        effectiveMode === "send" ? await submitSend() : await submitLog();
      // Reset transient fields so the next attempt starts fresh.
      setStatus("");
      setDuration("");
      setNotes("");
      setSubject("");
      setMessageBody("");
      setRecipient("");
      const tail = result.followUpTaskCreated
        ? " · follow-up task scheduled"
        : "";
      setToast(`${result.successMessage}${tail}`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "request failed");
    } finally {
      setBusy(false);
    }
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

      {sendCapable && (
        <div
          role="tablist"
          className="inline-flex rounded-lg border bg-zinc-50 p-0.5 text-xs"
        >
          <button
            type="button"
            role="tab"
            aria-selected={effectiveMode === "log"}
            onClick={() => setMode("log")}
            className={`rounded-md px-3 py-1 ${
              effectiveMode === "log"
                ? "bg-white shadow-sm font-medium"
                : "text-zinc-600 hover:bg-white/60"
            }`}
          >
            Log only
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={effectiveMode === "send"}
            onClick={() => setMode("send")}
            className={`rounded-md px-3 py-1 ${
              effectiveMode === "send"
                ? "bg-white shadow-sm font-medium"
                : "text-zinc-600 hover:bg-white/60"
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
          <label className="block text-xs">
            <span className="mb-1 block text-zinc-500">
              {channel === "SMS" ? "To (phone)" : "To (email)"}
              {recipientFallback && (
                <span className="ml-1 text-zinc-400">
                  · default: {recipientFallback}
                </span>
              )}
            </span>
            <input
              type={channel === "EMAIL" ? "email" : "tel"}
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder={recipientFallback || recipientPlaceholder}
              className="w-full rounded-lg border px-2 py-1.5 text-sm"
            />
          </label>

          {channel === "EMAIL" && (
            <label className="block text-xs">
              <span className="mb-1 block text-zinc-500">Subject</span>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Quick update on your case"
                className="w-full rounded-lg border px-2 py-1.5 text-sm"
                required
              />
            </label>
          )}

          <label className="block text-xs">
            <span className="mb-1 block text-zinc-500">Message</span>
            <textarea
              value={messageBody}
              onChange={(e) => setMessageBody(e.target.value)}
              rows={channel === "SMS" ? 3 : 5}
              maxLength={4000}
              className="w-full rounded-lg border px-2 py-1.5 text-sm font-sans"
              placeholder={
                channel === "SMS"
                  ? "Hi {name}, this is your case agent — quick update…"
                  : "Hi {name},\n\nQuick update on your surplus claim…"
              }
              required
            />
            {channel === "SMS" && (
              <span className="mt-0.5 block text-[10px] text-zinc-400">
                {messageBody.length}/1600 characters
              </span>
            )}
          </label>

          <label className="block text-xs">
            <span className="mb-1 block text-zinc-500">Internal notes (optional)</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full rounded-lg border px-2 py-1.5 text-sm"
              placeholder="Private context for your team"
            />
          </label>
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
