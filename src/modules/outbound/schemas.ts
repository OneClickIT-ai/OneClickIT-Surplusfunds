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

const SEND_CHANNEL = z.enum(["SMS", "EMAIL"]);

/**
 * Operator-driven outbound send. `to` is optional — when omitted we fall back
 * to the claimant's stored phone/email. Subject is required for EMAIL only;
 * the API enforces that constraint.
 */
export const sendOutboundSchema = z
  .object({
    channel: SEND_CHANNEL,
    to: z
      .preprocess(emptyToUndefined, z.string().max(200).optional())
      .optional(),
    subject: z
      .preprocess(emptyToUndefined, z.string().max(200).optional())
      .optional(),
    body: z.string().min(1).max(4000),
    notes: z
      .preprocess(emptyToUndefined, z.string().max(2000).optional())
      .optional(),
    claimantId: z.string().cuid().optional().nullable(),
  })
  .superRefine((val, ctx) => {
    if (val.channel === "EMAIL" && !val.subject) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["subject"],
        message: "subject is required for email",
      });
    }
  });

export type SendOutboundInput = z.infer<typeof sendOutboundSchema>;
