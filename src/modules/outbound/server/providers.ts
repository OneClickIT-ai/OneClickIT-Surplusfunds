import type { ContactChannel } from "@prisma/client";

/**
 * Thin HTTP clients for Twilio (SMS) and Resend (email). No new dependencies —
 * both providers expose simple REST endpoints, so a `fetch` wrapper is enough.
 *
 * Each call returns a normalized `SendResult` so callers can treat providers
 * interchangeably. Success surfaces the provider's own message id as
 * `providerMessageId` so we can reconcile delivery callbacks later.
 */

export type SendFailureStatus =
  // Normalized failure tokens that line up with CONTACT_STATUS_OPTIONS, so the
  // UI and follow-up classifier don't need a separate mapping table.
  | "failed"
  | "invalid_number"
  | "bounced"
  | "not_configured";

export type SendResult =
  | {
      ok: true;
      providerMessageId: string;
      providerStatus: string;
    }
  | {
      ok: false;
      status: SendFailureStatus;
      error: string;
    };

export interface SmsSendParams {
  to: string;
  body: string;
}

export interface EmailSendParams {
  to: string;
  subject: string;
  body: string;
  replyTo?: string;
}

/**
 * Twilio error codes worth treating as "invalid number" so the follow-up
 * automation can skip re-trying the same dead phone.
 * https://www.twilio.com/docs/api/errors
 */
const TWILIO_INVALID_NUMBER_CODES = new Set([
  21211, // Invalid 'To' Phone Number
  21614, // 'To' number is not a valid mobile number
  21408, // Permission to send SMS not enabled for the region
  21610, // Attempt to send to unsubscribed recipient
]);

function mapTwilioError(code: unknown): SendFailureStatus {
  if (typeof code === "number" && TWILIO_INVALID_NUMBER_CODES.has(code)) {
    return "invalid_number";
  }
  return "failed";
}

export async function sendSms(params: SmsSendParams): Promise<SendResult> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;

  if (!accountSid || !authToken || !from) {
    return {
      ok: false,
      status: "not_configured",
      error: "Twilio credentials are not configured",
    };
  }

  try {
    const auth = Buffer.from(`${accountSid}:${authToken}`).toString("base64");
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          To: params.to,
          From: from,
          Body: params.body,
        }).toString(),
      },
    );
    const json = (await res.json().catch(() => ({}))) as {
      sid?: string;
      status?: string;
      code?: number;
      message?: string;
    };
    if (!res.ok) {
      return {
        ok: false,
        status: mapTwilioError(json.code),
        error: json.message ?? `Twilio responded ${res.status}`,
      };
    }
    return {
      ok: true,
      providerMessageId: json.sid ?? "",
      providerStatus: json.status ?? "queued",
    };
  } catch (e) {
    return {
      ok: false,
      status: "failed",
      error: e instanceof Error ? e.message : "twilio request failed",
    };
  }
}

export async function sendEmail(params: EmailSendParams): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_ADDRESS;
  if (!apiKey || !from) {
    return {
      ok: false,
      status: "not_configured",
      error: "Resend credentials are not configured",
    };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [params.to],
        subject: params.subject,
        text: params.body,
        reply_to: params.replyTo,
      }),
    });
    const json = (await res.json().catch(() => ({}))) as {
      id?: string;
      name?: string;
      message?: string;
    };
    if (!res.ok) {
      // Resend returns `{name: "validation_error", message: "..."}` for bad addresses.
      const status: SendFailureStatus =
        json.name === "validation_error" ? "invalid_number" : "failed";
      return {
        ok: false,
        status,
        error: json.message ?? `Resend responded ${res.status}`,
      };
    }
    return {
      ok: true,
      providerMessageId: json.id ?? "",
      providerStatus: "sent",
    };
  } catch (e) {
    return {
      ok: false,
      status: "failed",
      error: e instanceof Error ? e.message : "resend request failed",
    };
  }
}

/**
 * Pure helper: given a provider result, pick the status string we should
 * write to ContactLog. Kept outside the DB layer so it's unit-testable.
 */
export function resultToLogStatus(
  result: SendResult,
): { status: string; externalId: string | null } {
  if (result.ok) {
    // Twilio reports "queued" on accept, but for operator-facing audit
    // "sent" is what matters; delivery callbacks can refine later.
    return {
      status: "sent",
      externalId: result.providerMessageId || null,
    };
  }
  return { status: result.status, externalId: null };
}

export function channelIsSendable(
  channel: ContactChannel,
): channel is "SMS" | "EMAIL" {
  return channel === "SMS" || channel === "EMAIL";
}
