/**
 * Twilio SMS provider. Talks to the REST API directly with fetch — no SDK,
 * so Node runtimes / edge-lite environments both work. Every path returns a
 * typed SendResult; callers must always write a ContactLog regardless of
 * success so the audit trail stays complete.
 */

export interface SendSmsInput {
  to: string;
  body: string;
}

export type SendSmsResult =
  | {
      ok: true;
      externalId: string;
      providerStatus: string;
    }
  | {
      ok: false;
      error: string;
      providerStatus: string;
      errorCode?: string;
    };

export interface TwilioConfig {
  accountSid: string;
  authToken: string;
  fromNumber: string;
}

export function readTwilioConfig(env: NodeJS.ProcessEnv = process.env): TwilioConfig | null {
  const accountSid = env.TWILIO_ACCOUNT_SID;
  const authToken = env.TWILIO_AUTH_TOKEN;
  const fromNumber = env.TWILIO_FROM_NUMBER;
  if (!accountSid || !authToken || !fromNumber) return null;
  return { accountSid, authToken, fromNumber };
}

export function normalizePhone(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("+")) {
    const digits = trimmed.slice(1).replace(/\D/g, "");
    return digits ? `+${digits}` : null;
  }
  const digits = trimmed.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return `+${digits}`;
}

export async function sendSms(
  input: SendSmsInput,
  config: TwilioConfig | null = readTwilioConfig(),
): Promise<SendSmsResult> {
  if (!config) {
    return {
      ok: false,
      error: "not_configured",
      providerStatus: "failed",
    };
  }

  const to = normalizePhone(input.to);
  if (!to) {
    return {
      ok: false,
      error: "invalid_number",
      providerStatus: "invalid_number",
    };
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(
    config.accountSid,
  )}/Messages.json`;
  const basic = Buffer.from(`${config.accountSid}:${config.authToken}`).toString("base64");
  const body = new URLSearchParams({
    To: to,
    From: config.fromNumber,
    Body: input.body,
  });

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${basic}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "network_error",
      providerStatus: "failed",
    };
  }

  const json = (await res.json().catch(() => ({}))) as {
    sid?: string;
    status?: string;
    code?: number | string;
    message?: string;
  };

  if (!res.ok) {
    return {
      ok: false,
      error: json.message ?? `twilio_http_${res.status}`,
      errorCode: json.code != null ? String(json.code) : undefined,
      providerStatus: json.status ?? "failed",
    };
  }

  return {
    ok: true,
    externalId: json.sid ?? "",
    providerStatus: json.status ?? "queued",
  };
}
