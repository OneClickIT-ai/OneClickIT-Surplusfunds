/**
 * E-sign provider stub.
 *
 * v1: no real provider integration. send() returns a placeholder URL and
 * logs the intended payload. The agreement row is moved to SENT; marking
 * as SIGNED currently requires an operator PATCH (or a future webhook).
 *
 * TODO: wire up Dropbox Sign / DocuSign / HelloSign here. The function
 * signatures below are chosen to match the common provider pattern
 * (create signature request -> get signing URL -> webhook on completion).
 */

export interface SendAgreementRequest {
  agreementId: string;
  signerEmail: string;
  signerName: string;
  subject: string;
  body: string;
}

export interface SendAgreementResult {
  eSignUrl: string;
  externalId: string;
  provider: string;
}

export async function sendForSignature(
  req: SendAgreementRequest,
): Promise<SendAgreementResult> {
  const provider = process.env.ESIGN_PROVIDER || "placeholder";

  if (provider === "placeholder") {
    // Local dev / pre-integration: log and return a fake URL pointing to the
    // internal view route so operators can at least see the rendered doc.
    console.info("[esign] placeholder send", {
      agreementId: req.agreementId,
      to: req.signerEmail,
      name: req.signerName,
    });
    const base = process.env.NEXTAUTH_URL || "";
    return {
      eSignUrl: `${base}/api/v1/agreements/${req.agreementId}/pdf`,
      externalId: `placeholder-${req.agreementId}`,
      provider: "placeholder",
    };
  }

  // TODO: real provider branches here.
  throw new Error(`ESIGN_PROVIDER "${provider}" is not implemented`);
}
