"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Channel = "SMS" | "EMAIL";

interface Props {
  caseId: string;
  claimant: {
    phone: string | null;
    email: string | null;
  } | null;
}

/**
 * Real outbound send — sits alongside the quick-log form. POSTs to
 * /api/v1/cases/:id/contacts/send which handles provider dispatch AND
 * the audit ContactLog. Surfaces provider failures inline with enough
 * detail that operators can fix the claimant record without a round trip.
 */
export function SendContact({ caseId, claimant }: Props) {
  const router = useRouter();
  const [channel, setChannel] = useState<Channel>("SMS");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [overrideTo, setOverrideTo] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const defaultRecipient =
    channel === "SMS" ? claimant?.phone ?? "" : claimant?.email ?? "";
  const recipient = overrideTo.trim() || defaultRecipient;
  const canSend = recipient.length > 0 && body.trim().length > 0 && (channel === "SMS" || subject.trim().length > 0);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const payload: Record<string, unknown> = {
        channel,
        body: body.trim(),
      };
      if (overrideTo.trim()) payload.to = overrideTo.trim();
      if (channel === "EMAIL") payload.subject = subject.trim();

      const res = await fetch(`/api/v1/cases/${caseId}/contacts/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));

      if (res.status === 201 && json.ok) {
        setBody("");
        setSubject("");
        setOverrideTo("");
        setNotice(
          channel === "SMS" ? "SMS queued with provider." : "Email sent.",
        );
        router.refresh();
        return;
      }

      // Provider or validation failure — the server still logged the attempt
      // when it reached the provider, so refresh to surface it in the timeline.
      if (json.followUpTaskCreated) {
        setError(
          `${json.error ?? "Send failed"}. A follow-up task was created.`,
        );
      } else {
        setError(json.error ?? `Request failed (${res.status})`);
      }
      if (json.contactLog) router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Send failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="flex gap-1.5">
        <button
          type="button"
          onClick={() => setChannel("SMS")}
          className={`rounded-full px-3 py-1 text-xs ${
            channel === "SMS"
              ? "bg-black text-white"
              : "border bg-zinc-50 text-zinc-700 hover:bg-zinc-100"
          }`}
        >
          SMS
        </button>
        <button
          type="button"
          onClick={() => setChannel("EMAIL")}
          className={`rounded-full px-3 py-1 text-xs ${
            channel === "EMAIL"
              ? "bg-black text-white"
              : "border bg-zinc-50 text-zinc-700 hover:bg-zinc-100"
          }`}
        >
          Email
        </button>
      </div>

      <label className="block text-xs">
        <span className="mb-1 block text-zinc-500">
          To {defaultRecipient ? `(default: ${defaultRecipient})` : "(no claimant contact on file)"}
        </span>
        <input
          type="text"
          value={overrideTo}
          onChange={(e) => setOverrideTo(e.target.value)}
          placeholder={channel === "SMS" ? "+15551234567" : "name@example.com"}
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
            className="w-full rounded-lg border px-2 py-1.5 text-sm"
            maxLength={200}
            required
          />
        </label>
      )}

      <label className="block text-xs">
        <span className="mb-1 block text-zinc-500">Message</span>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={4}
          className="w-full rounded-lg border px-2 py-1.5 text-sm"
          placeholder={
            channel === "SMS"
              ? "Short, direct. Reply STOP to opt out."
              : "Hi, following up on your surplus funds claim…"
          }
          maxLength={5000}
          required
        />
      </label>

      {notice && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-2 text-xs text-emerald-700">
          {notice}
        </div>
      )}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-2 text-xs text-red-700">
          {error}
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={busy || !canSend}
          className="rounded-lg bg-black px-4 py-1.5 text-xs text-white disabled:opacity-50"
        >
          {busy ? "Sending…" : channel === "SMS" ? "Send SMS" : "Send email"}
        </button>
      </div>
    </form>
  );
}
