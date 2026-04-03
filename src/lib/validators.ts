import { z } from 'zod';

export const countySchema = z.object({
  rank: z.number().int().positive(),
  name: z.string().min(1).max(100),
  state: z.string().length(2),
  population: z.number().int().nonnegative(),
  listUrl: z.string().url().optional().nullable(),
  source: z.string().max(500).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
  rulesText: z.string().optional().nullable(),
  claimDeadline: z.string().max(200).optional().nullable(),
});

export const alertSchema = z.object({
  countyId: z.string().cuid(),
  minAmount: z.number().positive().optional().nullable(),
});

export const searchSchema = z.object({
  q: z.string().max(200).nullish().transform(v => v ?? undefined),
  state: z.string().length(2).nullish().transform(v => v ?? undefined),
  minPop: z.coerce.number().int().nonnegative().nullish().transform(v => v ?? undefined),
  maxPop: z.coerce.number().int().positive().nullish().transform(v => v ?? undefined),
  page: z.coerce.number().int().positive().nullish().default(1).transform(v => v ?? 1),
  limit: z.coerce.number().int().min(1).max(100).nullish().default(20).transform(v => v ?? 20),
});

export type CountyInput = z.infer<typeof countySchema>;
export type AlertInput = z.infer<typeof alertSchema>;
export type SearchInput = z.infer<typeof searchSchema>;
