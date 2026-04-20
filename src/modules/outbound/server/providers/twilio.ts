import type { SendResult } from "./types";

const PROVIDER = "twilio";

/** Keep digits + leading "+", drop spacing/punctuation. */
export function normalizePhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const hasPlus = trimmed.startsWith("+");
  const digits = trimmed.replace(/\D+/g, "");
  if (!digits) return null;
  // US default: 10-digit numbers get a "+1" prefix.
  if (!hasPlus && digits.length === 10) return `+1${digits}`;
  if (hasPlus) return `+${digits}`;
  return `+${digits}`;
}

interface TwilioConfig {
  accountSid: string;
  authToken: string;
  fromNumber: string;
}

function readConfig(): TwilioConfig | null {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_FROM_NUMBER;
  if (!accountSid || !authToken || !fromNumber) return null;
  return { accountSid, authToken, fromNumber };
}

/**
 * Fetch-based Twilio SMS sender. Avoids pulling in the full SDK. Returns a
 * normalized SendResult so the caller can log success or failure uniformly.
 */
export async function sendSms(params: {
  to: string;
  body: string;
}): Promise<SendResult> {
  const cfg = readConfig();
  if (!cfg) {
    return {
      ok: false,
      provider: PROVIDER,
      reason: "not_configured",
      message: "Twilio credentials are not set",
    };
  }

  const normalizedTo = normalizePhone(params.to);
  if (!normalizedTo) {
    return {
      ok: false,
      provider: PROVIDER,
      reason: "invalid_recipient",
      message: "Recipient phone number is missing or invalid",
    };
  }

  const form = new URLSearchParams();
  form.set("To", normalizedTo);
  form.set("From", cfg.fromNumber);
  form.set("Body", params.body);

  const url = `https://api.twilio.com/2010-04-01/Accounts/${cfg.accountSid}/Messages.json`;
  const auth = Buffer.from(`${cfg.accountSid}:${cfg.authToken}`).toString("base64");

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form.toString(),
    });
    const json = (await res.json().catch(() => ({}))) as {
      sid?: string;
      status?: string;
      message?: string;
      code?: number;
    };

    if (!res.ok || !json.sid) {
      return {
        ok: false,
        provider: PROVIDER,
        reason: "provider_error",
        message: json.message ?? `Twilio responded ${res.status}`,
        providerStatus: json.status,
      };
    }

    return {
      ok: true,
      provider: PROVIDER,
      externalId: json.sid,
      providerStatus: json.status ?? "queued",
    };
  } catch (e) {
    return {
      ok: false,
      provider: PROVIDER,
      reason: "network_error",
      message: e instanceof Error ? e.message : "Twilio request failed",
    };
  }
}
