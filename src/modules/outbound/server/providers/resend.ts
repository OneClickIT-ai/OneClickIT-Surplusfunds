import type { SendResult } from "./types";

const PROVIDER = "resend";

/** Cheap sanity check — the real validation lives on Resend's side. */
export function looksLikeEmail(raw: string | null | undefined): boolean {
  if (!raw) return false;
  const trimmed = raw.trim();
  if (!trimmed) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
}

interface ResendConfig {
  apiKey: string;
  fromAddress: string;
}

function readConfig(): ResendConfig | null {
  const apiKey = process.env.RESEND_API_KEY;
  const fromAddress = process.env.RESEND_FROM_ADDRESS ?? process.env.EMAIL_FROM;
  if (!apiKey || !fromAddress) return null;
  return { apiKey, fromAddress };
}

export async function sendEmail(params: {
  to: string;
  subject: string;
  body: string;
}): Promise<SendResult> {
  const cfg = readConfig();
  if (!cfg) {
    return {
      ok: false,
      provider: PROVIDER,
      reason: "not_configured",
      message: "Resend API key or from address is not set",
    };
  }

  if (!looksLikeEmail(params.to)) {
    return {
      ok: false,
      provider: PROVIDER,
      reason: "invalid_recipient",
      message: "Recipient email address is missing or invalid",
    };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cfg.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: cfg.fromAddress,
        to: params.to.trim(),
        subject: params.subject,
        text: params.body,
      }),
    });
    const json = (await res.json().catch(() => ({}))) as {
      id?: string;
      message?: string;
      name?: string;
    };

    if (!res.ok || !json.id) {
      return {
        ok: false,
        provider: PROVIDER,
        reason: "provider_error",
        message: json.message ?? `Resend responded ${res.status}`,
      };
    }

    return {
      ok: true,
      provider: PROVIDER,
      externalId: json.id,
      providerStatus: "sent",
    };
  } catch (e) {
    return {
      ok: false,
      provider: PROVIDER,
      reason: "network_error",
      message: e instanceof Error ? e.message : "Resend request failed",
    };
  }
}
