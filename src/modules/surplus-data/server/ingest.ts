import type {
  LeadIngestItemResult,
  LeadIngestResponse,
  LeadIngestSummary,
} from "@/types/api";
import type { LeadIngestRequestParsed } from "../schemas";
import { planDedupe } from "./dedupe";
import {
  findCountyById,
  findExistingByKeys,
  upsertLead,
  upsertClaimantForLead,
  createIngestBatchRecord,
  type CountyRef,
} from "@/modules/leads/server/repository";
import { rescoreOne } from "@/modules/leads/server/scoring";

export interface IngestContext {
  userId: string | null;
}

export interface IngestServiceResult {
  response: LeadIngestResponse;
  httpStatus: 200 | 207 | 400 | 422;
}

/**
 * Orchestrate the full ingest pipeline:
 *   1. Resolve county
 *   2. Plan dedupe (intra-batch + required-field checks)
 *   3. Look up pre-existing SurplusLead rows
 *   4. Create batch audit record (so leads can link to it via fundsListId)
 *   5. Upsert SurplusLead rows + attached Claimant rows
 *   6. Finalize batch audit (update status on errors)
 *   7. Return structured summary + per-row results
 */
export async function ingestLeads(
  request: LeadIngestRequestParsed,
  ctx: IngestContext,
): Promise<IngestServiceResult> {
  const { source, countyId, dryRun, autoScore, items } = request;

  const results: LeadIngestItemResult[] = new Array(items.length);
  const summary: LeadIngestSummary = {
    received: items.length,
    created: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
  };

  // 1. County lookup
  const county: CountyRef | null = await findCountyById(countyId);
  if (!county) {
    return {
      httpStatus: 422,
      response: {
        success: false,
        batchId: null,
        summary,
        items: items.map((_, index) => ({
          index,
          status: "error",
          reason: "countyId not found",
        })),
      },
    };
  }

  // 2. Dedupe planning
  const plan = planDedupe(items, county.id);

  // 3. Cross-batch existence lookup
  const existingByKey = await findExistingByKeys(county, items);

  // 4. Batch audit record (skip on dryRun so we don't pollute the audit log)
  let batchId: string | null = null;
  if (!dryRun) {
    try {
      batchId = await createIngestBatchRecord(county.id, {
        source,
        received: summary.received,
        created: 0,
        updated: 0,
        skipped: 0,
        errors: 0,
        dryRun: false,
        userId: ctx.userId,
      });
    } catch (e) {
      console.error("[ingest] failed to create batch audit record", e);
    }
  }

  // 5. Per-row decisions + writes
  for (const entry of plan.entries) {
    const { index, item, key, intraBatchDuplicate, hasRequiredIdentifiers } = entry;

    if (!hasRequiredIdentifiers) {
      results[index] = {
        index,
        status: "skipped",
        reason:
          "row requires ownerName plus at least one of parcelId or propertyAddr",
      };
      summary.skipped += 1;
      continue;
    }

    if (intraBatchDuplicate) {
      results[index] = {
        index,
        status: "skipped",
        reason: "duplicate row within the same ingest batch",
      };
      summary.skipped += 1;
      continue;
    }

    const existingId = key ? existingByKey.get(key) : undefined;

    if (dryRun) {
      results[index] = {
        index,
        status: existingId ? "updated" : "created",
        leadId: existingId ?? undefined,
        reason: "dryRun — no write performed",
      };
      if (existingId) summary.updated += 1;
      else summary.created += 1;
      continue;
    }

    try {
      const r = await upsertLead({
        item,
        county,
        source,
        fundsListId: batchId,
        existingId: existingId ?? null,
      });
      // Claimant persistence is best-effort; failures are logged inside.
      await upsertClaimantForLead(r.id, item);

      // Optional scoring pass. Best-effort — a scoring failure should not
      // fail the ingest row.
      if (autoScore) {
        try {
          await rescoreOne(r.id);
        } catch (e) {
          console.error("[ingest] scoring failed for lead", r.id, e);
        }
      }

      results[index] = {
        index,
        status: r.wasCreated ? "created" : "updated",
        leadId: r.id,
      };
      if (r.wasCreated) summary.created += 1;
      else summary.updated += 1;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "unknown error";
      results[index] = {
        index,
        status: "error",
        reason: msg,
      };
      summary.errors += 1;
    }
  }

  // HTTP status choice:
  //  - 200: all eligible rows went through cleanly
  //  - 207: partial — some rows errored but at least one succeeded
  //  - 422: non-dryRun batch produced zero writes despite well-formed input
  const allSucceeded = summary.errors === 0;
  const nothingUsable =
    summary.created === 0 && summary.updated === 0 && summary.errors === 0;

  let httpStatus: 200 | 207 | 422;
  if (allSucceeded) {
    httpStatus = nothingUsable && !dryRun ? 422 : 200;
  } else if (summary.created + summary.updated > 0) {
    httpStatus = 207;
  } else {
    httpStatus = 422;
  }

  return {
    httpStatus,
    response: {
      success: allSucceeded,
      batchId,
      summary,
      items: results,
    },
  };
}
