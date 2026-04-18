import type { LeadIngestItem } from "../schemas";
import { computeDedupeKey } from "./normalize";

export interface DedupePlanEntry {
  index: number;
  item: LeadIngestItem;
  key: string | null;
  strategy: "parcel" | "owner_addr" | null;
  /** duplicate *within this same ingest batch* (rejected) */
  intraBatchDuplicate: boolean;
  /** true if ownerName present AND at least one of parcelId/propertyAddr present */
  hasRequiredIdentifiers: boolean;
}

export interface DedupePlan {
  entries: DedupePlanEntry[];
  /** All unique dedupe keys this batch intends to look up against the DB. */
  uniqueKeys: string[];
}

/**
 * Plan the dedupe step: decide per-row whether it has enough info to persist,
 * compute its dedupe key, and flag rows that duplicate each other within the
 * same request payload.
 *
 * Pure — no DB calls. The repository layer is responsible for cross-batch
 * lookups against persisted records.
 */
export function planDedupe(
  items: LeadIngestItem[],
  countyId: string,
): DedupePlan {
  const entries: DedupePlanEntry[] = [];
  const seen = new Set<string>();
  const uniqueKeys = new Set<string>();

  items.forEach((item, index) => {
    const hasOwner = !!item.ownerName?.trim();
    const hasParcel = !!item.parcelId?.trim();
    const hasAddr = !!item.propertyAddr?.trim();
    const hasRequiredIdentifiers = hasOwner && (hasParcel || hasAddr);

    const dk = computeDedupeKey(item, countyId);
    const intraBatchDuplicate = dk ? seen.has(dk.key) : false;
    if (dk) {
      seen.add(dk.key);
      uniqueKeys.add(dk.key);
    }

    entries.push({
      index,
      item,
      key: dk?.key ?? null,
      strategy: dk?.strategy ?? null,
      intraBatchDuplicate,
      hasRequiredIdentifiers,
    });
  });

  return { entries, uniqueKeys: Array.from(uniqueKeys) };
}
