import { z } from "zod";

const emptyToUndefined = (value: unknown) => {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
};

const AGREEMENT_TYPE = z.enum(["ENGAGEMENT", "ASSIGNMENT", "FEE_DISCLOSURE"]);
const AGREEMENT_STATUS = z.enum([
  "DRAFT",
  "SENT",
  "VIEWED",
  "SIGNED",
  "DECLINED",
  "EXPIRED",
]);

export const agreementsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  status: z.preprocess(emptyToUndefined, AGREEMENT_STATUS.optional()),
  type: z.preprocess(emptyToUndefined, AGREEMENT_TYPE.optional()),
  claimId: z.preprocess(emptyToUndefined, z.string().cuid().optional()),
});

export const createAgreementSchema = z.object({
  claimId: z.string().cuid(),
  claimantId: z.string().cuid().optional().nullable(),
  type: AGREEMENT_TYPE,
  feePercent: z.coerce.number().min(0).max(100).optional(),
});

export const updateAgreementSchema = z.object({
  status: AGREEMENT_STATUS.optional(),
  feePercent: z.coerce.number().min(0).max(100).nullable().optional(),
  signedAt: z.string().nullable().optional(),
  viewedAt: z.string().nullable().optional(),
});

export type AgreementsQueryInput = z.infer<typeof agreementsQuerySchema>;
export type CreateAgreementInput = z.infer<typeof createAgreementSchema>;
export type UpdateAgreementInput = z.infer<typeof updateAgreementSchema>;
