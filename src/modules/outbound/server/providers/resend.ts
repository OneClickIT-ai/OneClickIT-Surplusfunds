/**
 * Resend email provider. Uses the REST API directly with fetch to avoid a
 * new SDK dependency. Same contract as the Twilio adapter: always return a
 * typed SendResult so the caller can write a log row in every branch.
 */

export interface SendEmailInput {
  to: string;
  subject: string;
  body: string;
}

export type SendEmailResult =
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

export interface ResendConfig {
  apiKey: string;
  fromAddress: string;
}

export function readResendConfig(env: NodeJS.ProcessEnv = process.env): ResendConfig | null {
  const apiKey = env.RESEND_API_KEY;
  const fromAddress = env.RESEND_FROM_ADDRESS || env.EMAIL_FROM;
  if (!apiKey || !fromAddress) return null;
  return { apiKey, fromAddress };
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim().toLowerCase();
  return EMAIL_RE.test(trimmed) ? trimmed : null;
}

function bodyToHtml(body: string): string {
  return body.replace(/\n/g, "<br/>");
}

export async function sendEmail(
  input: SendEmailInput,
  config: ResendConfig | null = readResendConfig(),
): Promise<SendEmailResult> {
  if (!config) {
    return {
      ok: false,
      error: "not_configured",
      providerStatus: "failed",
    };
  }

  const to = normalizeEmail(input.to);
  if (!to) {
    return {
      ok: false,
      error: "invalid_address",
      providerStatus: "invalid_address",
    };
  }

  let res: Response;
  try {
    res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: config.fromAddress,
        to,
        subject: input.subject,
        html: bodyToHtml(input.body),
        text: input.body,
      }),
    });
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "network_error",
      providerStatus: "failed",
    };
  }

  const json = (await res.json().catch(() => ({}))) as {
    id?: string;
    name?: string;
    message?: string;
    statusCode?: number;
  };

  if (!res.ok) {
    return {
      ok: false,
      error: json.message ?? json.name ?? `resend_http_${res.status}`,
      errorCode: json.name,
      providerStatus: "failed",
    };
  }

  return {
    ok: true,
    externalId: json.id ?? "",
    providerStatus: "sent",
  };
}
