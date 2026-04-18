import { z } from "zod";

const emptyToUndefined = (value: unknown) => {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
};

/**
 * Query schema for GET /api/v1/leads. Accepts pagination + filters + a loose
 * search term `q` applied to ownerName / propertyAddr / parcelId.
 */
export const leadsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  state: z.preprocess(emptyToUndefined, z.string().length(2).optional()),
  countyId: z.preprocess(emptyToUndefined, z.string().optional()),
  status: z.preprocess(
    emptyToUndefined,
    z
      .enum(["NEW", "RESEARCHING", "SKIP_TRACED", "CONTACTED", "CONVERTED", "DEAD"])
      .optional(),
  ),
  surplusType: z.preprocess(
    emptyToUndefined,
    z.enum(["TAX_SALE", "FORECLOSURE", "MORTGAGE", "HOA", "OTHER"]).optional(),
  ),
  minAmount: z.coerce.number().nonnegative().optional(),
  maxAmount: z.coerce.number().nonnegative().optional(),
  minScore: z.coerce.number().int().min(0).max(100).optional(),
  q: z.preprocess(emptyToUndefined, z.string().max(200).optional()),
});

export type LeadsQueryInput = z.infer<typeof leadsQuerySchema>;
