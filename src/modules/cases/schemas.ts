import { z } from "zod";

const moneyToNumberOrUndefined = (value: unknown) => {
  if (value === null || value === undefined || value === "") return undefined;
  if (typeof value === "number") return Number.isFinite(value) ? value : undefined;
  if (typeof value === "string") {
    const cleaned = value.replace(/[$,\s]/g, "");
    if (!cleaned) return undefined;
    const parsed = Number.parseFloat(cleaned);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
};

export const createCaseSchema = z.object({
  leadId: z.string().cuid().optional(),
  claimantId: z.string().cuid().optional(),
  countyName: z.string().min(1).max(200),
  state: z.string().length(2),
  ownerName: z.string().min(1).max(200),
  propertyAddr: z.string().max(500).optional().nullable(),
  parcelId: z.string().max(100).optional().nullable(),
  amount: z.preprocess(moneyToNumberOrUndefined, z.number().nonnegative().optional().nullable()),
  deadlineDate: z.string().optional().nullable(),
  feePercent: z.preprocess(
    moneyToNumberOrUndefined,
    z.number().min(0).max(100).optional().nullable(),
  ),
  surplusType: z
    .enum(["TAX_SALE", "FORECLOSURE", "MORTGAGE", "HOA", "OTHER"])
    .default("TAX_SALE"),
  requiresCourt: z.boolean().optional().default(false),
  notes: z.string().max(2000).optional().nullable(),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  assigneeId: z.string().cuid().optional().nullable(),
});

export const updateCaseSchema = z.object({
  status: z
    .enum([
      "research",
      "contacted",
      "docs_gathering",
      "filed",
      "approved",
      "paid",
      "denied",
      "court_petition",
      "hearing_scheduled",
    ])
    .optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  assigneeId: z.string().cuid().nullable().optional(),
  amount: z.preprocess(moneyToNumberOrUndefined, z.number().nonnegative().nullable().optional()),
  feePercent: z.preprocess(
    moneyToNumberOrUndefined,
    z.number().min(0).max(100).nullable().optional(),
  ),
  filedDate: z.string().nullable().optional(),
  paidDate: z.string().nullable().optional(),
  paidAmount: z.preprocess(
    moneyToNumberOrUndefined,
    z.number().nonnegative().nullable().optional(),
  ),
  deadlineDate: z.string().nullable().optional(),
  hearingDate: z.string().nullable().optional(),
  requiresCourt: z.boolean().optional(),
  courtCaseNum: z.string().max(100).nullable().optional(),
  notes: z.string().max(5000).nullable().optional(),
});

const emptyToUndefined = (value: unknown) => {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
};

/** Query schema for GET /api/v1/cases. */
export const casesQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  state: z.preprocess(emptyToUndefined, z.string().length(2).optional()),
  status: z.preprocess(
    emptyToUndefined,
    z
      .enum([
        "research",
        "contacted",
        "docs_gathering",
        "filed",
        "approved",
        "paid",
        "denied",
        "court_petition",
        "hearing_scheduled",
      ])
      .optional(),
  ),
  priority: z.preprocess(
    emptyToUndefined,
    z.enum(["low", "medium", "high"]).optional(),
  ),
  assigneeId: z.preprocess(emptyToUndefined, z.string().cuid().optional()),
  countyName: z.preprocess(emptyToUndefined, z.string().max(200).optional()),
  surplusType: z.preprocess(
    emptyToUndefined,
    z.enum(["TAX_SALE", "FORECLOSURE", "MORTGAGE", "HOA", "OTHER"]).optional(),
  ),
  q: z.preprocess(emptyToUndefined, z.string().max(200).optional()),
});

/** POST /api/v1/leads/:id/convert body. All fields optional. */
export const convertLeadSchema = z.object({
  feePercent: z.preprocess(
    moneyToNumberOrUndefined,
    z.number().min(0).max(100).optional().nullable(),
  ),
  priority: z.enum(["low", "medium", "high"]).optional(),
  assigneeId: z.string().cuid().optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
  requiresCourt: z.boolean().optional(),
});

export type CreateCaseInput = z.infer<typeof createCaseSchema>;
export type UpdateCaseInput = z.infer<typeof updateCaseSchema>;
export type CasesQueryInput = z.infer<typeof casesQuerySchema>;
export type ConvertLeadInput = z.infer<typeof convertLeadSchema>;
