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

export const sendSmsSchema = z.object({
  body: z.string().trim().min(1, "message body is required").max(1600),
  to: z
    .preprocess(emptyToUndefined, z.string().max(30).optional())
    .optional(),
  claimantId: z.string().cuid().optional().nullable(),
});

export const sendEmailSchema = z.object({
  subject: z.string().trim().min(1, "subject is required").max(200),
  body: z.string().trim().min(1, "message body is required").max(10_000),
  to: z
    .preprocess(emptyToUndefined, z.string().email().optional())
    .optional(),
  replyTo: z
    .preprocess(emptyToUndefined, z.string().email().optional())
    .optional(),
  claimantId: z.string().cuid().optional().nullable(),
});

export const sendContactSchema = z.discriminatedUnion("channel", [
  sendSmsSchema.extend({ channel: z.literal("SMS") }),
  sendEmailSchema.extend({ channel: z.literal("EMAIL") }),
]);

export type CreateContactLogInput = z.infer<typeof createContactLogSchema>;
export type UpdateContactLogInput = z.infer<typeof updateContactLogSchema>;
export type SendSmsInput = z.infer<typeof sendSmsSchema>;
export type SendEmailInput = z.infer<typeof sendEmailSchema>;
export type SendContactInput = z.infer<typeof sendContactSchema>;
