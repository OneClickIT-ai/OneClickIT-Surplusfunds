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

// Send-and-log: operators click "Send SMS" / "Send Email" and we actually
// dispatch through Twilio/Resend. `subject` only applies to EMAIL.
export const sendContactSchema = z
  .object({
    channel: z.enum(["SMS", "EMAIL"]),
    body: z
      .preprocess(emptyToUndefined, z.string().min(1).max(1600))
      .transform((v) => String(v)),
    subject: z
      .preprocess(emptyToUndefined, z.string().max(200).optional())
      .optional(),
    claimantId: z.string().cuid().optional().nullable(),
  })
  .refine(
    (v) => v.channel !== "EMAIL" || (typeof v.subject === "string" && v.subject.trim().length > 0),
    { message: "subject is required for EMAIL", path: ["subject"] },
  );

export type CreateContactLogInput = z.infer<typeof createContactLogSchema>;
export type UpdateContactLogInput = z.infer<typeof updateContactLogSchema>;
export type SendContactInput = z.infer<typeof sendContactSchema>;
