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
  claimantPhone?: string | null;
  claimantEmail?: string | null;
}

/**
 * Contact control for a case. Two modes:
 *
 *  - "log" (default): operator records what already happened (call notes,
 *    voicemail, in-person visit, etc). Routes to the ContactLog POST endpoint.
 *  - "send": live outbound via Twilio (SMS) or Resend (email). Routes to the
 *    /send endpoint which always writes an audit row with the provider
 *    outcome — so operators never have a silent send.
 *
 * Send mode is only available for SMS + EMAIL today. CALL / MAIL / IN_PERSON
 * stay log-only; automated voice is deliberately out of scope here.
 */
export function ContactActions({
  caseId,
  claimantPhone,
  claimantEmail,
}: ContactActionsProps) {
  const router = useRouter();
  const [channel, setChannel] = useState<Channel>("CALL");
  const [mode, setMode] = useState<Mode>("log");
  const [direction, setDirection] = useState<Direction>("outbound");
  const [status, setStatus] = useState("");
  const [duration, setDuration] = useState("");
  const [notes, setNotes] = useState("");
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const canSend = channel === "SMS" || channel === "EMAIL";
  const effectiveMode: Mode = canSend ? mode : "log";
  const defaultTo =
    channel === "SMS" ? claimantPhone ?? "" : claimantEmail ?? "";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setToast(null);
    try {
      if (effectiveMode === "send") {
        const payload: Record<string, unknown> = {
          channel,
          body: body.trim(),
        };
        if (to.trim()) payload.to = to.trim();
        if (channel === "EMAIL" && subject.trim()) payload.subject = subject.trim();
        if (notes.trim()) payload.notes = notes.trim();

        const res = await fetch(`/api/v1/cases/${caseId}/contacts/send`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json.error ?? "send failed");

        if (json.send?.ok) {
          setToast(
            json.followUpTaskCreated
              ? "Sent · follow-up scheduled"
              : `Sent via ${json.send.provider ?? "provider"}`,
          );
        } else {
          const reason =
            json.send?.error ??
            (json.providerConfigured === false
              ? "provider not configured — logged as failed"
              : "send failed — logged as failed");
          setError(reason);
        }
        setBody("");
        setSubject("");
      } else {
        const payload: Record<string, unknown> = { channel, direction };
        if (status.trim()) payload.status = status.trim();
        if (notes.trim()) payload.notes = notes.trim();
        const durNum = Number(duration);
        if (duration && Number.isFinite(durNum) && durNum > 0) {
          payload.duration = Math.floor(durNum);
        }

        const res = await fetch(`/api/v1/cases/${caseId}/contacts`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json.error ?? "log failed");

        setStatus("");
        setDuration("");
        setToast(
          json.followUpTaskCreated
            ? "Logged · follow-up scheduled"
            : "Contact logged",
        );
      }
      setNotes("");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "request failed");
    } finally {
      setBusy(false);
    }
  }

  function pickChannel(next: Channel) {
    setChannel(next);
    setStatus("");
    setTo("");
    if (next !== "SMS" && next !== "EMAIL") setMode("log");
  }

  const showDuration = channel === "CALL" && effectiveMode === "log";
  const statusOptions = CONTACT_STATUS_OPTIONS[channel] ?? [];
  const submitLabel =
    effectiveMode === "send"
      ? busy
        ? "Sending…"
        : `Send ${channel === "SMS" ? "SMS" : "email"}`
      : busy
        ? "Logging…"
        : `Log ${CHANNELS.find((c) => c.key === channel)?.label.toLowerCase()}`;

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
        <div className="flex items-center gap-1 rounded-lg border bg-zinc-50 p-0.5 text-[11px]">
          <button
            type="button"
            onClick={() => setMode("log")}
            className={`flex-1 rounded-md px-2 py-1 ${
              effectiveMode === "log"
                ? "bg-white shadow-sm font-medium"
                : "text-zinc-600"
            }`}
          >
            Log attempt
          </button>
          <button
            type="button"
            onClick={() => setMode("send")}
            className={`flex-1 rounded-md px-2 py-1 ${
              effectiveMode === "send"
                ? "bg-white shadow-sm font-medium"
                : "text-zinc-600"
            }`}
          >
            Send now
          </button>
        </div>
      )}

      {effectiveMode === "send" ? (
        <div className="space-y-2">
          <label className="block text-xs">
            <span className="mb-1 block text-zinc-500">
              {channel === "SMS" ? "To (phone)" : "To (email)"}
            </span>
            <input
              type="text"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder={defaultTo || (channel === "SMS" ? "+15551234567" : "name@example.com")}
              className="w-full rounded-lg border px-2 py-1.5 text-sm"
            />
            {!to && defaultTo && (
              <span className="mt-0.5 block text-[10px] text-zinc-500">
                Will send to claimant default: {defaultTo}
              </span>
            )}
            {!to && !defaultTo && (
              <span className="mt-0.5 block text-[10px] text-amber-700">
                No claimant {channel === "SMS" ? "phone" : "email"} on file — enter one above.
              </span>
            )}
          </label>
          {channel === "EMAIL" && (
            <label className="block text-xs">
              <span className="mb-1 block text-zinc-500">Subject</span>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                maxLength={200}
                placeholder="Your surplus funds case"
                className="w-full rounded-lg border px-2 py-1.5 text-sm"
              />
            </label>
          )}
          <label className="block text-xs">
            <span className="mb-1 block text-zinc-500">Message</span>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={channel === "EMAIL" ? 6 : 4}
              maxLength={4000}
              required
              className="w-full rounded-lg border px-2 py-1.5 text-sm"
              placeholder={
                channel === "SMS"
                  ? "Hi — following up on your surplus funds claim…"
                  : "Write the email body here…"
              }
            />
            <span className="mt-0.5 block text-[10px] text-zinc-500">
              {body.length}/4000
            </span>
          </label>
        </div>
      ) : (
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
      )}

      <label className="block text-xs">
        <span className="mb-1 block text-zinc-500">
          {effectiveMode === "send" ? "Internal notes" : "Notes"}
        </span>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="w-full rounded-lg border px-2 py-1.5 text-sm"
          placeholder={
            effectiveMode === "send"
              ? "Not shown to claimant; attached to audit log only."
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
          disabled={
            busy ||
            (effectiveMode === "send" && !body.trim())
          }
          className="rounded-lg bg-black px-4 py-1.5 text-xs text-white disabled:opacity-50"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
