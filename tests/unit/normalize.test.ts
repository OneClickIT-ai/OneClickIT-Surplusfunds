import { describe, it, expect } from "vitest";
import {
  computeDedupeKey,
  buildCombinedNotes,
} from "@/modules/surplus-data/server/normalize";
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

describe("computeDedupeKey", () => {
  it("prefers parcelId + countyId when parcelId is present", () => {
    const k = computeDedupeKey(
      makeItem({ parcelId: "ABC-123", propertyAddr: "1 main st" }),
      "county_1",
    );
    expect(k).toEqual({ key: "parcel:county_1:abc-123", strategy: "parcel" });
  });

  it("falls back to owner+addr key when parcelId is missing", () => {
    const k = computeDedupeKey(
      makeItem({ ownerName: "Jane  Doe", propertyAddr: "1 MAIN  ST" }),
      "county_1",
    );
    expect(k?.strategy).toBe("owner_addr");
    // whitespace collapsed + lowercased
    expect(k?.key).toBe("owner_addr:county_1:jane doe|1 main st");
  });

  it("returns null when neither parcelId nor propertyAddr exist", () => {
    const k = computeDedupeKey(makeItem({ ownerName: "Jane" }), "county_1");
    expect(k).toBeNull();
  });

  it("treats whitespace-only parcelId as missing", () => {
    const k = computeDedupeKey(
      makeItem({ parcelId: "   ", propertyAddr: "1 main" }),
      "c",
    );
    expect(k?.strategy).toBe("owner_addr");
  });
});

describe("buildCombinedNotes", () => {
  it("concatenates notes + contact + type tags and is non-null when any present", () => {
    const out = buildCombinedNotes(
      makeItem({
        notes: "talked to sister",
        claimantPhone: "5551234567",
        claimantEmail: "a@b.com",
      }),
      "scraper",
      "TAX_SALE",
    );
    expect(out).toContain("talked to sister");
    expect(out).toContain("Phone: 5551234567");
    expect(out).toContain("Email: a@b.com");
    expect(out).toContain("[source:scraper]");
    expect(out).toContain("[type:TAX_SALE]");
  });

  it("still returns non-null (has tags) even with nothing supplied", () => {
    const out = buildCombinedNotes(makeItem(), "manual_entry", "OTHER");
    expect(out).toContain("[source:manual_entry]");
    expect(out).toContain("[type:OTHER]");
  });
});
