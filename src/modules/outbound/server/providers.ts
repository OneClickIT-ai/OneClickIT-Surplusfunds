/**
 * Thin REST-only adapters for outbound SMS (Twilio) and email (Resend).
 *
 * Why fetch and not the vendor SDKs: both providers expose a tiny, stable
 * REST surface that we hit from one call site, so pulling in a whole SDK
 * isn't worth the dependency footprint.
 *
 * Every send returns a normalized shape with a canonical status token that
 * maps onto the same taxonomy our ContactLog / follow-up classifier already
 * understands — see modules/outbound/follow-up.ts.
 */

export type OutboundChannel = "SMS" | "EMAIL";

export interface OutboundSendResult {
  /** True iff the provider accepted the send. Delivery is async. */
  ok: boolean;
  /** Canonical status token — aligned with CONTACT_STATUS_OPTIONS. */
  status: string;
  /** Provider-side id, stored on ContactLog.externalId for auditability. */
  externalId: string | null;
  /** Human-readable error, surfaced into ContactLog.notes on failures. */
  error: string | null;
  /** Which provider handled the send — null if nothing was configured. */
  provider: string | null;
}

export function isTwilioConfigured(): boolean {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_FROM_NUMBER,
  );
}

export function isResendConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

export function isChannelSendConfigured(channel: OutboundChannel): boolean {
  return channel === "SMS" ? isTwilioConfigured() : isResendConfigured();
}

/**
 * Map a Twilio Message.status (queued/sending/sent/delivered/undelivered/failed)
 * onto one of our canonical CONTACT_STATUS_OPTIONS tokens.
 */
export function mapTwilioStatus(raw: string | null | undefined): string {
  const s = (raw ?? "").toLowerCase();
  if (s === "delivered") return "delivered";
  if (s === "failed" || s === "undelivered") return "failed";
  if (s === "sent" || s === "queued" || s === "sending" || s === "accepted") {
    return "sent";
  }
  return "sent";
}

function basicAuth(user: string, pass: string): string {
  // Edge-safe: Buffer exists on Node runtimes, which is what these routes use.
  return "Basic " + Buffer.from(`${user}:${pass}`).toString("base64");
}

export interface TwilioSmsPayload {
  to: string;
  body: string;
}

/**
 * Send an SMS via Twilio Programmable Messaging.
 * Never throws — all failures come back as `{ ok: false, status: "failed" }`
 * so the caller can always persist an audit row.
 */
export async function sendTwilioSms(
  payload: TwilioSmsPayload,
): Promise<OutboundSendResult> {
  if (!isTwilioConfigured()) {
    return {
      ok: false,
      status: "failed",
      externalId: null,
      error: "twilio is not configured",
      provider: null,
    };
  }
  const accountSid = process.env.TWILIO_ACCOUNT_SID!;
  const authToken = process.env.TWILIO_AUTH_TOKEN!;
  const from = process.env.TWILIO_FROM_NUMBER!;

  try {
    const form = new URLSearchParams({
      To: payload.to,
      From: from,
      Body: payload.body,
    });
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: basicAuth(accountSid, authToken),
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: form.toString(),
      },
    );
    const json = (await res.json().catch(() => ({}))) as {
      sid?: string;
      status?: string;
      message?: string;
      code?: number;
    };
    if (!res.ok) {
      return {
        ok: false,
        status: "failed",
        externalId: json.sid ?? null,
        error: json.message ?? `twilio ${res.status}`,
        provider: "twilio",
      };
    }
    return {
      ok: true,
      status: mapTwilioStatus(json.status),
      externalId: json.sid ?? null,
      error: null,
      provider: "twilio",
    };
  } catch (e) {
    return {
      ok: false,
      status: "failed",
      externalId: null,
      error: e instanceof Error ? e.message : "twilio request failed",
      provider: "twilio",
    };
  }
}

export interface ResendEmailPayload {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

/**
 * Send an email via Resend. Same contract as sendTwilioSms — never throws,
 * always returns a normalized shape.
 */
export async function sendResendEmail(
  payload: ResendEmailPayload,
): Promise<OutboundSendResult> {
  if (!isResendConfigured()) {
    return {
      ok: false,
      status: "failed",
      externalId: null,
      error: "resend is not configured",
      provider: null,
    };
  }
  const apiKey = process.env.RESEND_API_KEY!;
  const from = process.env.EMAIL_FROM!;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: payload.to,
        subject: payload.subject,
        text: payload.text,
        ...(payload.html ? { html: payload.html } : {}),
      }),
    });
    const json = (await res.json().catch(() => ({}))) as {
      id?: string;
      message?: string;
      name?: string;
    };
    if (!res.ok) {
      return {
        ok: false,
        status: "failed",
        externalId: json.id ?? null,
        error: json.message ?? `resend ${res.status}`,
        provider: "resend",
      };
    }
    return {
      ok: true,
      status: "sent",
      externalId: json.id ?? null,
      error: null,
      provider: "resend",
    };
  } catch (e) {
    return {
      ok: false,
      status: "failed",
      externalId: null,
      error: e instanceof Error ? e.message : "resend request failed",
      provider: "resend",
    };
  }
}
