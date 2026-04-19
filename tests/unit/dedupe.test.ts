import { describe, it, expect } from "vitest";
import { planDedupe } from "@/modules/surplus-data/server/dedupe";
import type { LeadIngestItem } from "@/modules/surplus-data/schemas";

function makeItem(overrides: Partial<LeadIngestItem> = {}): LeadIngestItem {
  return {
    ownerName: "JANE DOE",
    parcelId: null,
    propertyAddr: null,
    surplusAmount: null,
    saleDate: null,
    deadlineDate: null,
    surplusType: "OTHER",
    claimantPhone: null,
    claimantEmail: null,
    notes: null,
    ...overrides,
  };
}

describe("planDedupe", () => {
  it("flags intra-batch duplicates by parcelId", () => {
    const plan = planDedupe(
      [
        makeItem({ parcelId: "P-1", propertyAddr: "1" }),
        makeItem({ parcelId: "P-1", propertyAddr: "different addr" }),
      ],
      "c1",
    );
    expect(plan.entries[0].intraBatchDuplicate).toBe(false);
    expect(plan.entries[1].intraBatchDuplicate).toBe(true);
    expect(plan.uniqueKeys).toHaveLength(1);
  });

  it("treats same owner+addr variations as one dedupe key (case/whitespace insensitive)", () => {
    const plan = planDedupe(
      [
        makeItem({ ownerName: "Jane Doe", propertyAddr: "1 MAIN ST" }),
        makeItem({ ownerName: "JANE  DOE", propertyAddr: "1 main  st" }),
      ],
      "c1",
    );
    expect(plan.entries[0].intraBatchDuplicate).toBe(false);
    expect(plan.entries[1].intraBatchDuplicate).toBe(true);
  });

  it("reports hasRequiredIdentifiers correctly", () => {
    const plan = planDedupe(
      [
        makeItem({ ownerName: "a", parcelId: "P-1" }), // ok via parcel
        makeItem({ ownerName: "b", propertyAddr: "addr" }), // ok via addr
        makeItem({ ownerName: "c" }), // missing both -> false
        makeItem({ ownerName: "", parcelId: "P-2" }), // missing owner -> false
      ],
      "c1",
    );
    expect(plan.entries.map((e) => e.hasRequiredIdentifiers)).toEqual([
      true,
      true,
      false,
      false,
    ]);
  });
});
