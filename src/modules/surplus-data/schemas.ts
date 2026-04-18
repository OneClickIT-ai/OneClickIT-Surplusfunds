import { z } from "zod";
import type { SurplusType } from "@/types/api";

/**
 * Normalization helpers.
 *
 * We accept loose input (CSV, partner APIs, scrapers) and coerce into a
 * canonical shape the rest of the pipeline relies on.
 */

/** Trim strings and coerce empty strings to null. Leaves nulls/undefineds alone. */
const nullableTrimmedString = z
  .preprocess((v) => {
    if (v === undefined || v === null) return null;
    if (typeof v !== "string") return v;
    const trimmed = v.trim();
    return trimmed.length === 0 ? null : trimmed;
  }, z.string().nullable())
  .nullable();

/** Lowercase email; null if empty/invalid input shape. */
const nullableEmail = z
  .preprocess((v) => {
    if (v === undefined || v === null) return null;
    if (typeof v !== "string") return v;
    const trimmed = v.trim().toLowerCase();
    return trimmed.length === 0 ? null : trimmed;
  }, z.string().nullable())
  .nullable();

/** Strip non-digits from phone; null if empty. */
const nullablePhone = z
  .preprocess((v) => {
    if (v === undefined || v === null) return null;
    if (typeof v !== "string") return v;
    const digits = v.replace(/\D/g, "");
    return digits.length === 0 ? null : digits;
  }, z.string().nullable())
  .nullable();

/** Required trimmed string — rejects empty. */
const requiredTrimmedString = z.preprocess(
  (v) => (typeof v === "string" ? v.trim() : v),
  z.string().min(1, "required"),
);

/**
 * Accept numbers, or strings like "$18,342.22", "18342", "18,342.22 USD", "".
 * Returns number | null (null if unparseable or empty).
 */
const surplusAmount = z
  .preprocess((v) => {
    if (v === undefined || v === null) return null;
    if (typeof v === "number") return Number.isFinite(v) ? v : null;
    if (typeof v !== "string") return null;
    const cleaned = v.replace(/[^0-9.\-]/g, "").trim();
    if (cleaned === "" || cleaned === "-" || cleaned === ".") return null;
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : null;
  }, z.number().nullable())
  .nullable();

/**
 * Parse loose date strings (ISO, US mm/dd/yyyy, yyyy-mm-dd). Returns Date | null.
 * Invalid / empty -> null.
 */
const looseDate = z
  .preprocess((v) => {
    if (v === undefined || v === null) return null;
    if (v instanceof Date) return Number.isNaN(v.getTime()) ? null : v;
    if (typeof v !== "string") return null;
    const trimmed = v.trim();
    if (trimmed === "") return null;
    const d = new Date(trimmed);
    return Number.isNaN(d.getTime()) ? null : d;
  }, z.date().nullable())
  .nullable();

const surplusTypeEnum: z.ZodType<SurplusType> = z.enum([
  "TAX_SALE",
  "FORECLOSURE",
  "MORTGAGE",
  "HOA",
  "OTHER",
]);

export const leadIngestItemSchema = z.object({
  ownerName: requiredTrimmedString,
  parcelId: nullableTrimmedString.optional().default(null),
  propertyAddr: nullableTrimmedString.optional().default(null),
  surplusAmount: surplusAmount.optional().default(null),
  saleDate: looseDate.optional().default(null),
  deadlineDate: looseDate.optional().default(null),
  surplusType: surplusTypeEnum.optional().default("OTHER"),
  claimantPhone: nullablePhone.optional().default(null),
  claimantEmail: nullableEmail.optional().default(null),
  notes: nullableTrimmedString.optional().default(null),
});

export type LeadIngestItem = z.infer<typeof leadIngestItemSchema>;

export const leadIngestRequestSchema = z.object({
  source: z.enum(["csv_upload", "scraper", "api_partner", "manual_entry"]),
  countyId: z.string().min(1, "countyId required"),
  dryRun: z.boolean().optional().default(false),
  autoScore: z.boolean().optional().default(false),
  items: z
    .array(leadIngestItemSchema)
    .min(1, "items must contain at least one row")
    .max(5000, "items cannot exceed 5000 rows per request"),
});

export type LeadIngestRequestParsed = z.infer<typeof leadIngestRequestSchema>;
