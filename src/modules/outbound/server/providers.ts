/**
 * Outbound message providers. Thin wrappers over Twilio (SMS) and Resend
 * (email) using native fetch — no new dependencies.
 *
 * Design rules:
 *  - Every send returns a normalized `ProviderSendResult` — never throws.
 *    Callers always get enough information to persist an auditable log row.
 *  - If credentials are missing we fall back to `dry_run` so local / preview
 *    environments don't silently drop outbound operations. Operators still
 *    get a log row they can edit.
 */

export type ProviderChannel = "SMS" | "EMAIL";

export type ProviderSendStatus =
  | "sent" // accepted by the provider
  | "failed" // provider returned an error
  | "dry_run"; // no credentials configured; no external call made

export interface ProviderSendResult {
  status: ProviderSendStatus;
  externalId: string | null;
  providerStatus: string | null;
  error: string | null;
}

export interface SmsSendInput {
  to: string;
  body: string;
}

export interface EmailSendInput {
  to: string;
  subject: string;
  body: string;
}

const TWILIO_BASE = "https://api.twilio.com/2010-04-01";
const RESEND_BASE = "https://api.resend.com";

export function isSmsProviderConfigured(): boolean {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_FROM_NUMBER,
  );
}

export function isEmailProviderConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM);
}

async function safeErrorText(res: Response): Promise<string> {
  try {
    const text = await res.text();
    return text.slice(0, 500);
  } catch {
    return `HTTP ${res.status}`;
  }
}

export async function sendSmsViaTwilio(
  input: SmsSendInput,
): Promise<ProviderSendResult> {
  if (!isSmsProviderConfigured()) {
    return {
      status: "dry_run",
      externalId: null,
      providerStatus: null,
      error: null,
    };
  }

  const sid = process.env.TWILIO_ACCOUNT_SID!;
  const token = process.env.TWILIO_AUTH_TOKEN!;
  const from = process.env.TWILIO_FROM_NUMBER!;
  const auth = Buffer.from(`${sid}:${token}`).toString("base64");

  const form = new URLSearchParams();
  form.set("To", input.to);
  form.set("From", from);
  form.set("Body", input.body);

  try {
    const res = await fetch(`${TWILIO_BASE}/Accounts/${sid}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form.toString(),
    });
    if (!res.ok) {
      return {
        status: "failed",
        externalId: null,
        providerStatus: `http_${res.status}`,
        error: await safeErrorText(res),
      };
    }
    const json = (await res.json()) as { sid?: string; status?: string };
    return {
      status: "sent",
      externalId: json.sid ?? null,
      providerStatus: json.status ?? "queued",
      error: null,
    };
  } catch (e) {
    return {
      status: "failed",
      externalId: null,
      providerStatus: "network_error",
      error: e instanceof Error ? e.message : "twilio send failed",
    };
  }
}

export async function sendEmailViaResend(
  input: EmailSendInput,
): Promise<ProviderSendResult> {
  if (!isEmailProviderConfigured()) {
    return {
      status: "dry_run",
      externalId: null,
      providerStatus: null,
      error: null,
    };
  }

  const key = process.env.RESEND_API_KEY!;
  const from = process.env.RESEND_FROM!;

  try {
    const res = await fetch(`${RESEND_BASE}/emails`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [input.to],
        subject: input.subject,
        text: input.body,
      }),
    });
    if (!res.ok) {
      return {
        status: "failed",
        externalId: null,
        providerStatus: `http_${res.status}`,
        error: await safeErrorText(res),
      };
    }
    const json = (await res.json()) as { id?: string };
    return {
      status: "sent",
      externalId: json.id ?? null,
      providerStatus: "sent",
      error: null,
    };
  } catch (e) {
    return {
      status: "failed",
      externalId: null,
      providerStatus: "network_error",
      error: e instanceof Error ? e.message : "resend send failed",
    };
  }
}

export async function dispatchProviderSend(
  channel: ProviderChannel,
  input: { to: string; subject?: string; body: string },
): Promise<ProviderSendResult> {
  if (channel === "SMS") {
    return sendSmsViaTwilio({ to: input.to, body: input.body });
  }
  return sendEmailViaResend({
    to: input.to,
    subject: input.subject ?? "Regarding your case",
    body: input.body,
  });
}
