import type { LeadIngestItem } from "../schemas";

/**
 * Compute the canonical dedupe key for a lead row scoped to a county.
 *
 * Strategy (per spec):
 *   1) parcelId + countyId when parcelId exists
 *   2) otherwise ownerName + propertyAddr + countyId
 */
export function computeDedupeKey(
  item: LeadIngestItem,
  countyId: string,
): { key: string; strategy: "parcel" | "owner_addr" } | null {
  const parcel = item.parcelId?.trim();
  if (parcel) {
    return {
      key: `parcel:${countyId}:${parcel.toLowerCase()}`,
      strategy: "parcel",
    };
  }
  const addr = item.propertyAddr?.trim();
  const owner = item.ownerName.trim();
  if (addr && owner) {
    const addrNorm = addr.toLowerCase().replace(/\s+/g, " ");
    const ownerNorm = owner.toLowerCase().replace(/\s+/g, " ");
    return {
      key: `owner_addr:${countyId}:${ownerNorm}|${addrNorm}`,
      strategy: "owner_addr",
    };
  }
  return null;
}

/**
 * Build a compact notes blob that preserves claimant contact info, the
 * provided notes, and any hints about source — so data is not lost when we
 * fall back to persisting into the Claim model.
 *
 * TODO: remove once Claimant/Contact models exist and contacts get their own row.
 */
export function buildCombinedNotes(
  item: LeadIngestItem,
  source: string,
  surplusType: string,
): string | null {
  const parts: string[] = [];
  if (item.notes) parts.push(item.notes);
  if (item.claimantPhone) parts.push(`Phone: ${item.claimantPhone}`);
  if (item.claimantEmail) parts.push(`Email: ${item.claimantEmail}`);
  if (item.saleDate) parts.push(`Sale date: ${item.saleDate.toISOString().slice(0, 10)}`);
  parts.push(`[source:${source}]`);
  parts.push(`[type:${surplusType}]`);
  const joined = parts.filter(Boolean).join("\n");
  return joined.length > 0 ? joined : null;
}
