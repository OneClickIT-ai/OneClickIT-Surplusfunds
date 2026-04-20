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

export interface ContactActionsProps {
  caseId: string;
  /** Claimant contact info (used to hint who outbound SMS / email reach). */
  claimant?: {
    phone?: string | null;
    email?: string | null;
  } | null;
}

/**
 * Operator contact panel. Two modes on one form:
 *
 *  - **Log**: record a contact that already happened (quick-log). Hits
 *    POST /api/v1/cases/:id/contacts.
 *  - **Send**: fire a real outbound SMS (Twilio) or email (Resend) from the
 *    app. Hits POST /api/v1/cases/:id/contacts/send, which writes an audit
 *    row regardless of send outcome and auto-schedules a follow-up task if
 *    the provider reports failure.
 *
 * Only SMS and Email are sendable; other channels stay in log mode.
 */
export function ContactActions({ caseId, claimant }: ContactActionsProps) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("log");
  const [channel, setChannel] = useState<Channel>("CALL");
  const [direction, setDirection] = useState<Direction>("outbound");
  const [status, setStatus] = useState("");
  const [duration, setDuration] = useState("");
  const [notes, setNotes] = useState("");
  const [subject, setSubject] = useState("");
  const [overrideTo, setOverrideTo] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const canSendCurrentChannel = channel === "SMS" || channel === "EMAIL";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setToast(null);
    try {
      if (mode === "send") {
        await submitSend();
      } else {
        await submitLog();
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "request failed");
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
      json.followUpTaskCreated ? "Logged — follow-up task scheduled" : "Contact logged",
    );
  }

  async function submitSend() {
    if (!canSendCurrentChannel) {
      throw new Error("Only SMS and Email can be sent from the app");
    }
    if (!notes.trim()) {
      throw new Error("Message body is required");
    }
    if (channel === "EMAIL" && !subject.trim()) {
      throw new Error("Email subject is required");
    }

    const payload: Record<string, unknown> = {
      channel,
      body: notes.trim(),
    };
    if (overrideTo.trim()) payload.to = overrideTo.trim();
    if (channel === "EMAIL") payload.subject = subject.trim();

    const res = await fetch(`/api/v1/cases/${caseId}/contacts/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json().catch(() => ({}));

    if (res.status === 404) throw new Error("case not found");
    if (res.status === 403) throw new Error("forbidden");
    if (res.status === 400 && json?.error) throw new Error(json.error);
    if (res.status === 429) throw new Error("rate limit exceeded — try again shortly");

    if (json?.success) {
      setNotes("");
      setSubject("");
      setOverrideTo("");
      setToast(
        json.followUpTaskCreated
          ? `${channel === "SMS" ? "SMS" : "Email"} sent — follow-up scheduled`
          : `${channel === "SMS" ? "SMS" : "Email"} sent`,
      );
      return;
    }

    // Provider rejected the send. Status 502/503: audit row still written unless
    // auditWritten === false. Surface a precise operator-readable error.
    const providerError =
      json?.sendResult && !json.sendResult.ok
        ? json.sendResult.error
        : (json?.error ?? `send failed (${res.status})`);
    const auditNote =
      json?.auditWritten === false
        ? " — audit log NOT written; check Sentry"
        : " — logged as failed attempt";
    throw new Error(`${providerError}${auditNote}`);
  }

  function pickChannel(next: Channel) {
    setChannel(next);
    setStatus("");
    if (next !== "SMS" && next !== "EMAIL" && mode === "send") {
      setMode("log");
    }
  }

  const showDuration = mode === "log" && channel === "CALL";
  const statusOptions = CONTACT_STATUS_OPTIONS[channel] ?? [];
  const defaultRecipient =
    channel === "SMS" ? claimant?.phone : channel === "EMAIL" ? claimant?.email : null;

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="flex gap-1.5 rounded-full bg-zinc-100 p-1 text-xs">
        <button
          type="button"
          onClick={() => setMode("log")}
          className={`flex-1 rounded-full px-3 py-1 ${
            mode === "log" ? "bg-white shadow-sm font-medium" : "text-zinc-600"
          }`}
        >
          Log what happened
        </button>
        <button
          type="button"
          onClick={() => setMode("send")}
          disabled={!canSendCurrentChannel}
          className={`flex-1 rounded-full px-3 py-1 disabled:opacity-40 ${
            mode === "send" ? "bg-white shadow-sm font-medium" : "text-zinc-600"
          }`}
          title={
            canSendCurrentChannel
              ? undefined
              : "Select SMS or Email to send from the app"
          }
        >
          Send from app
        </button>
      </div>

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

      {mode === "log" ? (
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
        <>
          <label className="block text-xs">
            <span className="mb-1 block text-zinc-500">
              Recipient ({channel === "SMS" ? "phone" : "email"})
            </span>
            <input
              type="text"
              value={overrideTo}
              onChange={(e) => setOverrideTo(e.target.value)}
              placeholder={
                defaultRecipient
                  ? `Defaults to ${defaultRecipient}`
                  : "No claimant contact on file — enter one"
              }
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
                placeholder="e.g. Update on your surplus claim"
                className="w-full rounded-lg border px-2 py-1.5 text-sm"
              />
            </label>
          )}
        </>
      )}

      <label className="block text-xs">
        <span className="mb-1 block text-zinc-500">
          {mode === "send" ? "Message" : "Notes"}
        </span>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={mode === "send" ? 5 : 3}
          className="w-full rounded-lg border px-2 py-1.5 text-sm"
          placeholder={
            mode === "send"
              ? channel === "SMS"
                ? "Keep SMS short — ~160 chars"
                : "Email body"
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
          disabled={busy}
          className="rounded-lg bg-black px-4 py-1.5 text-xs text-white disabled:opacity-50"
        >
          {busy
            ? mode === "send"
              ? "Sending…"
              : "Logging…"
            : mode === "send"
              ? `Send ${channel === "SMS" ? "SMS" : "email"}`
              : `Log ${CHANNELS.find((c) => c.key === channel)?.label.toLowerCase()}`}
        </button>
      </div>
    </form>
  );
}
