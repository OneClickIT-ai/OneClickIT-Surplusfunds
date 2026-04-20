import { ProviderConfigError, type OutboundResult } from "./types";

/**
 * Map a Twilio Message Resource `status` to our canonical ContactLog status
 * tokens. Tokens in the FAILED set in `follow-up.ts` automatically trigger a
 * follow-up task via `logContact`, so the mapping has to stay in sync with
 * that classifier.
 *
 * Twilio statuses (subset we care about): queued, sending, sent, delivered,
 * undelivered, failed.  See: https://www.twilio.com/docs/sms/api/message-resource#message-status-values
 */
export function classifyTwilioStatus(raw: string | null | undefined): {
  ok: boolean;
  status: string;
} {
  const v = (raw ?? "").trim().toLowerCase();
  switch (v) {
    case "delivered":
      return { ok: true, status: "delivered" };
    case "queued":
    case "sending":
    case "sent":
      // Twilio acks acceptance well before the carrier confirms delivery.
      // Treat as "sent" — operators see it landed at the provider.
      return { ok: true, status: "sent" };
    case "undelivered":
      return { ok: false, status: "undeliverable" };
    case "failed":
      return { ok: false, status: "failed" };
    default:
      // Unknown / missing status from a non-2xx body is treated as failure
      // so the operator gets nudged.
      return { ok: false, status: "failed" };
  }
}

export interface TwilioConfig {
  accountSid: string;
  authToken: string;
  from: string;
}

function readConfig(): TwilioConfig {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;
  if (!accountSid || !authToken || !from) {
    throw new ProviderConfigError(
      "Twilio not configured (TWILIO_ACCOUNT_SID/AUTH_TOKEN/FROM_NUMBER)",
    );
  }
  return { accountSid, authToken, from };
}

export interface SendSmsParams {
  to: string;
  body: string;
}

/**
 * Fire-and-await SMS send via Twilio's Message resource. No SDK to keep the
 * dep tree small; we just hit the REST endpoint with Basic auth.
 *
 * Returns an OutboundResult regardless of success — callers always log it.
 */
export async function sendTwilioSms(
  params: SendSmsParams,
  config: TwilioConfig = readConfig(),
): Promise<OutboundResult> {
  const url = `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(
    config.accountSid,
  )}/Messages.json`;

  const form = new URLSearchParams({
    To: params.to,
    From: config.from,
    Body: params.body,
  });
  const auth = Buffer.from(`${config.accountSid}:${config.authToken}`).toString(
    "base64",
  );

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form.toString(),
    });
  } catch (err) {
    return {
      ok: false,
      status: "failed",
      externalId: null,
      errorCode: "network_error",
      errorMessage: err instanceof Error ? err.message : String(err),
    };
  }

  let json: Record<string, unknown> = {};
  try {
    json = (await res.json()) as Record<string, unknown>;
  } catch {
    // Twilio occasionally returns non-JSON on infra errors; leave json empty.
  }

  if (!res.ok) {
    return {
      ok: false,
      status: "failed",
      externalId: typeof json.sid === "string" ? json.sid : null,
      errorCode: json.code != null ? String(json.code) : String(res.status),
      errorMessage:
        typeof json.message === "string" ? json.message : res.statusText,
    };
  }

  const classified = classifyTwilioStatus(
    typeof json.status === "string" ? json.status : null,
  );
  return {
    ok: classified.ok,
    status: classified.status,
    externalId: typeof json.sid === "string" ? json.sid : null,
  };
}
