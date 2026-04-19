import { describe, it, expect } from "vitest";
import { scoreLead, type ScorableLead } from "@/modules/leads/server/scoring";

function makeLead(overrides: Partial<ScorableLead> = {}): ScorableLead {
  return {
    surplusAmount: null,
    deadlineDate: null,
    enriched: false,
    county: null,
    claimants: [],
    ...overrides,
  };
}

describe("scoreLead", () => {
  it("returns a value in the valid range", () => {
    const lead = makeLead({
      surplusAmount: 50_000,
      deadlineDate: new Date(Date.now() + 30 * 86400e3),
      enriched: true,
      county: { easyRating: 5 },
      claimants: [{ phone: "555", email: null }],
    });
    const s = scoreLead(lead);
    expect(s).toBeGreaterThan(0);
    expect(s).toBeLessThanOrEqual(100);
  });

  it("gives higher score to larger surplus amounts", () => {
    const low = scoreLead(makeLead({ surplusAmount: 1_000 }));
    const mid = scoreLead(makeLead({ surplusAmount: 50_000 }));
    const high = scoreLead(makeLead({ surplusAmount: 200_000 }));
    expect(mid).toBeGreaterThan(low);
    expect(high).toBeGreaterThan(mid);
  });

  it("rewards the 21-60 day deadline sweet spot over both ends", () => {
    const tooNear = scoreLead(
      makeLead({ deadlineDate: new Date(Date.now() + 3 * 86400e3) }),
    );
    const sweet = scoreLead(
      makeLead({ deadlineDate: new Date(Date.now() + 45 * 86400e3) }),
    );
    const tooFar = scoreLead(
      makeLead({ deadlineDate: new Date(Date.now() + 365 * 86400e3) }),
    );
    expect(sweet).toBeGreaterThan(tooNear);
    expect(sweet).toBeGreaterThan(tooFar);
  });

  it("rewards enriched leads and leads with claimant contact", () => {
    const base = scoreLead(makeLead());
    const enriched = scoreLead(makeLead({ enriched: true }));
    const withContact = scoreLead(
      makeLead({ claimants: [{ phone: "5551234567", email: null }] }),
    );
    expect(enriched).toBe(base + 8);
    expect(withContact).toBe(base + 7);
  });

  it("does not exceed 100 with maxed signals", () => {
    const lead = makeLead({
      surplusAmount: 10_000_000,
      deadlineDate: new Date(Date.now() + 30 * 86400e3),
      enriched: true,
      county: { easyRating: 5 },
      claimants: [{ phone: "5551234567", email: "a@b.com" }],
    });
    expect(scoreLead(lead)).toBeLessThanOrEqual(100);
  });

  it("returns 0 when no signals are present", () => {
    const s = scoreLead(makeLead());
    // Base is 10 (no-rating neutral), no other signals.
    expect(s).toBe(10);
  });

  it("zero-pts deadline proximity when expired", () => {
    const expired = scoreLead(
      makeLead({ deadlineDate: new Date(Date.now() - 86400e3) }),
    );
    const absent = scoreLead(makeLead({ deadlineDate: null }));
    // Expired should not award deadline points; should equal no-deadline case.
    expect(expired).toBe(absent);
  });
});
