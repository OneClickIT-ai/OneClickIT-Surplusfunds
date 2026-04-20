/**
 * Shared types for outbound send providers. Every provider returns a
 * normalized SendResult so the caller can log a consistent audit row
 * regardless of which vendor processed the request.
 */

export interface SendSuccess {
  ok: true;
  externalId: string;
  providerStatus: string;
  provider: string;
}

export interface SendFailure {
  ok: false;
  provider: string;
  /** Short machine-ish code: "not_configured" | "invalid_recipient" | "provider_error" | "network_error". */
  reason: string;
  /** Human-readable detail — safe to surface to operators, not to claimants. */
  message: string;
  providerStatus?: string;
}

export type SendResult = SendSuccess | SendFailure;
