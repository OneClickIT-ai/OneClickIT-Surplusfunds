import { ProviderConfigError, type OutboundResult } from "./types";

export interface ResendConfig {
  apiKey: string;
  from: string;
}

function readConfig(): ResendConfig {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) {
    throw new ProviderConfigError(
      "Resend not configured (RESEND_API_KEY / RESEND_FROM_EMAIL)",
    );
  }
  return { apiKey, from };
}

export interface SendEmailParams {
  to: string;
  subject: string;
  text: string;
  /** Optional HTML body; falls back to text if omitted. */
  html?: string;
}

/**
 * POST to Resend's `/emails` endpoint. Resend acks the send synchronously and
 * returns `{ id }` on success. Bounces/opens/etc. arrive later via webhooks
 * (out of scope here — the auditable record is the initial send result).
 */
export async function sendResendEmail(
  params: SendEmailParams,
  config: ResendConfig = readConfig(),
): Promise<OutboundResult> {
  const payload = {
    from: config.from,
    to: [params.to],
    subject: params.subject,
    text: params.text,
    ...(params.html ? { html: params.html } : {}),
  };

  let res: Response;
  try {
    res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
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
    // Body might be empty on rare 5xx; leave json empty.
  }

  if (!res.ok) {
    // Resend returns { name, message, statusCode } on errors. 422 typically
    // means a validation or address issue; map to a token operators can act on.
    const errCode = typeof json.name === "string" ? json.name : String(res.status);
    const errMsg = typeof json.message === "string" ? json.message : res.statusText;
    const isAddressIssue =
      res.status === 422 ||
      /invalid.*(address|email|recipient)/i.test(errMsg) ||
      /bounce/i.test(errMsg);
    return {
      ok: false,
      status: isAddressIssue ? "bounced" : "failed",
      externalId: typeof json.id === "string" ? json.id : null,
      errorCode: errCode,
      errorMessage: errMsg,
    };
  }

  return {
    ok: true,
    status: "sent",
    externalId: typeof json.id === "string" ? json.id : null,
  };
}
