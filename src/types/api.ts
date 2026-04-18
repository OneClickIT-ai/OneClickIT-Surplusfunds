/**
 * Shared API types for the v1 surface.
 *
 * Keep this file free of imports from runtime modules so it can be used by
 * both server route handlers and (eventually) client code.
 */

export type IngestSource =
  | "csv_upload"
  | "scraper"
  | "api_partner"
  | "manual_entry";

export type SurplusType =
  | "TAX_SALE"
  | "FORECLOSURE"
  | "MORTGAGE"
  | "HOA"
  | "OTHER";

/** Raw, pre-normalization shape accepted by the ingest endpoint. */
export interface LeadIngestItemInput {
  ownerName: string;
  parcelId?: string | null;
  propertyAddr?: string | null;
  surplusAmount?: number | string | null;
  saleDate?: string | null;
  deadlineDate?: string | null;
  surplusType?: SurplusType;
  claimantPhone?: string | null;
  claimantEmail?: string | null;
  notes?: string | null;
}

/** Normalized shape after Zod preprocess runs. */
export interface LeadIngestItemNormalized {
  ownerName: string;
  parcelId: string | null;
  propertyAddr: string | null;
  surplusAmount: number | null;
  saleDate: Date | null;
  deadlineDate: Date | null;
  surplusType: SurplusType;
  claimantPhone: string | null;
  claimantEmail: string | null;
  notes: string | null;
}

export interface LeadIngestRequest {
  source: IngestSource;
  countyId: string;
  dryRun?: boolean;
  autoScore?: boolean;
  items: LeadIngestItemInput[];
}

export type LeadIngestItemStatus =
  | "created"
  | "updated"
  | "skipped"
  | "error";

export interface LeadIngestItemResult {
  index: number;
  status: LeadIngestItemStatus;
  leadId?: string;
  reason?: string;
}

export interface LeadIngestSummary {
  received: number;
  created: number;
  updated: number;
  skipped: number;
  errors: number;
}

export interface LeadIngestResponse {
  success: boolean;
  batchId: string | null;
  summary: LeadIngestSummary;
  items: LeadIngestItemResult[];
}
