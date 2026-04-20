/**
 * Shared shape for outbound provider results.
 *
 * `status` is the canonical token we persist on ContactLog.status. Anything
 * matching `isFailedContactStatus` will trigger a follow-up task downstream.
 *
 * `externalId` lets us reconcile later (Twilio Message SID, Resend message id).
 */
export interface OutboundResult {
  ok: boolean;
  status: string;
  externalId: string | null;
  errorCode?: string | null;
  errorMessage?: string | null;
}

export class ProviderConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProviderConfigError";
  }
}
