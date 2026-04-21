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

export type CreateContactLogInput = z.infer<typeof createContactLogSchema>;
export type UpdateContactLogInput = z.infer<typeof updateContactLogSchema>;

// Channels that support a real outbound send through a provider today.
// (Calls still go through manual quick-log; telephony would be a future add.)
const SENDABLE_CHANNEL = z.enum(["SMS", "EMAIL"]);

export const sendContactSchema = z.object({
  channel: SENDABLE_CHANNEL,
  to: z
    .preprocess(emptyToUndefined, z.string().max(200).optional())
    .optional()
    .nullable(),
  subject: z
    .preprocess(emptyToUndefined, z.string().max(200).optional())
    .optional()
    .nullable(),
  body: z
    .string()
    .trim()
    .min(1, "body is required")
    .max(2000, "body is too long"),
  claimantId: z.string().cuid().optional().nullable(),
});

export type SendContactInput = z.infer<typeof sendContactSchema>;
