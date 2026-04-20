import { z } from "zod";

const CHANNEL = z.enum(["CALL", "SMS", "EMAIL", "MAIL", "IN_PERSON"]);
const DIRECTION = z.enum(["outbound", "inbound"]);

const emptyToUndefined = (v: unknown) => {
  if (typeof v !== "string") return v;
  const t = v.trim();
  return t === "" ? undefined : t;
};

export const createContactLogSchema = z.object({
  channel: CHANNEL,
  direction: DIRECTION.default("outbound"),
  status: z
    .preprocess(emptyToUndefined, z.string().max(100).optional())
    .optional(),
  notes: z
    .preprocess(emptyToUndefined, z.string().max(2000).optional())
    .optional(),
  duration: z.coerce.number().int().nonnegative().max(86_400).optional(),
  claimantId: z.string().cuid().optional().nullable(),
  externalId: z.string().max(200).optional().nullable(),
});

export const updateContactLogSchema = z.object({
  status: z.string().max(100).nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
  duration: z.coerce.number().int().nonnegative().max(86_400).nullable().optional(),
});

/**
 * Payload for the live-send endpoint. `to` is optional — when absent we fall
 * back to the linked claimant's phone/email. Body max matches the widest
 * practical provider limit so we don't eagerly truncate legitimate content.
 */
export const sendContactSchema = z.object({
  channel: z.enum(["SMS", "EMAIL"]),
  to: z
    .preprocess(emptyToUndefined, z.string().min(3).max(254).optional())
    .optional(),
  body: z.string().trim().min(1).max(4000),
  subject: z
    .preprocess(emptyToUndefined, z.string().max(200).optional())
    .optional(),
  notes: z
    .preprocess(emptyToUndefined, z.string().max(2000).optional())
    .optional(),
});

export type CreateContactLogInput = z.infer<typeof createContactLogSchema>;
export type UpdateContactLogInput = z.infer<typeof updateContactLogSchema>;
export type SendContactSchemaInput = z.infer<typeof sendContactSchema>;
