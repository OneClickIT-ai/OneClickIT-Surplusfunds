import { z } from "zod";

export const issueTokenSchema = z.object({
  ttlDays: z.number().int().min(1).max(365).optional(),
});

export const signAgreementSchema = z.object({
  typedName: z.string().min(2).max(200),
  agreementId: z.string().cuid(),
});

export type IssueTokenInput = z.infer<typeof issueTokenSchema>;
export type SignAgreementInput = z.infer<typeof signAgreementSchema>;
