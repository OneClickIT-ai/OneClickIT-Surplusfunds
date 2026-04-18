import { prisma } from "@/lib/prisma";
import type { LeadStatus, SurplusType } from "@prisma/client";
import type { LeadIngestItem } from "@/modules/surplus-data/schemas";

/**
 * Lead repository — writes to the normalized `SurplusLead` + `Claimant` tables.
 *
 * The earlier fallback into `Claim` is gone now that the schema migration has
 * added dedicated lead/claimant tables. Case creation (distinct workflow)
 * continues to write to `Claim` via the `cases` module.
 */

export interface CountyRef {
  id: string;
  name: string;
  state: string;
}

export async function findCountyById(countyId: string): Promise<CountyRef | null> {
  return prisma.county.findUnique({
    where: { id: countyId },
    select: { id: true, name: true, state: true },
  });
}

/**
 * Look up pre-existing SurplusLead rows that could collide with the inbound
 * batch. Returns a map keyed by the same dedupe key the ingest service computes.
 *
 * Dedupe keys:
 *   parcel:<countyId>:<parcelId>
 *   owner_addr:<countyId>:<owner>|<addr>
 */
export async function findExistingByKeys(
  county: CountyRef,
  items: LeadIngestItem[],
): Promise<Map<string, string>> {
  const parcelIds = items
    .map((i) => i.parcelId?.trim())
    .filter((v): v is string => !!v);

  const ownerAddrPairs = items
    .filter((i) => !i.parcelId?.trim() && !!i.propertyAddr?.trim())
    .map((i) => ({
      ownerName: i.ownerName,
      propertyAddr: i.propertyAddr as string,
    }));

  const orClauses: Array<Record<string, unknown>> = [];
  if (parcelIds.length > 0) {
    orClauses.push({ parcelId: { in: parcelIds } });
  }
  for (const p of ownerAddrPairs) {
    orClauses.push({
      AND: [
        { ownerName: { equals: p.ownerName, mode: "insensitive" } },
        { propertyAddr: { equals: p.propertyAddr, mode: "insensitive" } },
      ],
    });
  }

  if (orClauses.length === 0) return new Map();

  const existing = await prisma.surplusLead.findMany({
    where: {
      countyId: county.id,
      OR: orClauses,
    },
    select: {
      id: true,
      parcelId: true,
      ownerName: true,
      propertyAddr: true,
    },
  });

  const keyToId = new Map<string, string>();
  for (const row of existing) {
    const parcel = row.parcelId?.trim();
    if (parcel) {
      keyToId.set(`parcel:${county.id}:${parcel.toLowerCase()}`, row.id);
      continue;
    }
    const addr = row.propertyAddr?.trim();
    if (addr && row.ownerName) {
      const addrNorm = addr.toLowerCase().replace(/\s+/g, " ");
      const ownerNorm = row.ownerName.toLowerCase().replace(/\s+/g, " ");
      keyToId.set(`owner_addr:${county.id}:${ownerNorm}|${addrNorm}`, row.id);
    }
  }
  return keyToId;
}

export interface UpsertLeadInput {
  item: LeadIngestItem;
  county: CountyRef;
  source: string;
  fundsListId: string | null;
  existingId?: string | null;
}

export interface UpsertLeadResult {
  id: string;
  wasCreated: boolean;
}

export async function upsertLead({
  item,
  county,
  source,
  fundsListId,
  existingId,
}: UpsertLeadInput): Promise<UpsertLeadResult> {
  const data = {
    countyId: county.id,
    fundsListId,
    ownerName: item.ownerName,
    parcelId: item.parcelId,
    propertyAddr: item.propertyAddr,
    surplusAmount: item.surplusAmount ?? null,
    saleDate: item.saleDate,
    deadlineDate: item.deadlineDate,
    surplusType: item.surplusType as SurplusType,
    notes: item.notes,
    source,
  };

  if (existingId) {
    await prisma.surplusLead.update({
      where: { id: existingId },
      data,
    });
    return { id: existingId, wasCreated: false };
  }

  const created = await prisma.surplusLead.create({
    data: {
      ...data,
      status: "NEW" as LeadStatus,
    },
    select: { id: true },
  });
  return { id: created.id, wasCreated: true };
}

/**
 * Persist claimant contact info when either phone or email was supplied.
 * Idempotent on (leadId, email) when email is present; otherwise creates a new
 * record tied to the lead. Claimant persistence failures are non-fatal for the
 * ingest pipeline — we log and continue.
 */
export async function upsertClaimantForLead(
  leadId: string,
  item: LeadIngestItem,
): Promise<void> {
  if (!item.claimantPhone && !item.claimantEmail) return;

  try {
    if (item.claimantEmail) {
      const existing = await prisma.claimant.findFirst({
        where: { leadId, email: item.claimantEmail },
        select: { id: true },
      });
      if (existing) {
        await prisma.claimant.update({
          where: { id: existing.id },
          data: {
            fullName: item.ownerName,
            phone: item.claimantPhone ?? undefined,
            address: item.propertyAddr ?? undefined,
          },
        });
        return;
      }
    }
    await prisma.claimant.create({
      data: {
        leadId,
        fullName: item.ownerName,
        phone: item.claimantPhone,
        email: item.claimantEmail,
        address: item.propertyAddr,
      },
    });
  } catch (e) {
    console.error("[ingest] claimant upsert failed for lead", leadId, e);
  }
}

export interface IngestBatchSummary {
  source: string;
  received: number;
  created: number;
  updated: number;
  skipped: number;
  errors: number;
  dryRun: boolean;
  userId: string | null;
}

/**
 * Create an IngestBatch audit record. For now this still uses `FundsList` as
 * the container (it already links to County + carries a JSON payload). Return
 * the id so the orchestrator can set `fundsListId` on each newly-created
 * SurplusLead row.
 */
export async function createIngestBatchRecord(
  countyId: string,
  summary: IngestBatchSummary,
): Promise<string> {
  const rec = await prisma.fundsList.create({
    data: {
      countyId,
      status: summary.errors > 0 ? "partial" : "ingested",
      fundsData: {
        kind: "lead_ingest_batch",
        ...summary,
        at: new Date().toISOString(),
      },
    },
    select: { id: true },
  });
  return rec.id;
}
