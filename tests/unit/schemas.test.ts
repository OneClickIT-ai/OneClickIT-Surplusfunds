import { describe, it, expect } from "vitest";
import {
  leadIngestRequestSchema,
  leadIngestItemSchema,
} from "@/modules/surplus-data/schemas";
import { convertLeadSchema, createCaseSchema } from "@/modules/cases/schemas";
import { createTaskSchema } from "@/modules/tasks/schemas";

describe("leadIngestItemSchema", () => {
  it("normalizes money strings with $, commas, and spaces", () => {
    const r = leadIngestItemSchema.parse({
      ownerName: "  Jane  ",
      parcelId: "P-1",
      surplusAmount: "$18,342.22",
    });
    expect(r.surplusAmount).toBe(18342.22);
    expect(r.ownerName).toBe("Jane");
  });

  it("empty strings collapse to null", () => {
    const r = leadIngestItemSchema.parse({
      ownerName: "Jane",
      parcelId: "",
      propertyAddr: "",
      notes: "   ",
    });
    expect(r.parcelId).toBeNull();
    expect(r.propertyAddr).toBeNull();
    expect(r.notes).toBeNull();
  });

  it("lowercases email, strips phone non-digits", () => {
    const r = leadIngestItemSchema.parse({
      ownerName: "Jane",
      parcelId: "P-1",
      claimantEmail: "  Jane@EXAMPLE.com ",
      claimantPhone: "(555) 123-4567",
    });
    expect(r.claimantEmail).toBe("jane@example.com");
    expect(r.claimantPhone).toBe("5551234567");
  });

  it("rejects when ownerName is missing", () => {
    const r = leadIngestItemSchema.safeParse({});
    expect(r.success).toBe(false);
  });

  it("parses loose date strings to Date, invalid -> null", () => {
    const r = leadIngestItemSchema.parse({
      ownerName: "x",
      parcelId: "P",
      saleDate: "2026-05-01",
      deadlineDate: "not a date",
    });
    expect(r.saleDate).toBeInstanceOf(Date);
    expect(r.deadlineDate).toBeNull();
  });
});

describe("leadIngestRequestSchema", () => {
  it("rejects empty items[]", () => {
    const r = leadIngestRequestSchema.safeParse({
      source: "csv_upload",
      countyId: "c1",
      items: [],
    });
    expect(r.success).toBe(false);
  });

  it("rejects > 5000 items", () => {
    const items = Array.from({ length: 5001 }, () => ({
      ownerName: "x",
      parcelId: "p",
    }));
    const r = leadIngestRequestSchema.safeParse({
      source: "csv_upload",
      countyId: "c1",
      items,
    });
    expect(r.success).toBe(false);
  });

  it("accepts minimal valid payload with defaults", () => {
    const r = leadIngestRequestSchema.parse({
      source: "manual_entry",
      countyId: "c1",
      items: [{ ownerName: "Jane", parcelId: "P-1" }],
    });
    expect(r.dryRun).toBe(false);
    expect(r.autoScore).toBe(false);
    expect(r.items).toHaveLength(1);
  });
});

describe("convertLeadSchema", () => {
  it("accepts empty body (all fields optional)", () => {
    expect(convertLeadSchema.safeParse({}).success).toBe(true);
  });

  it("rejects feePercent above 100", () => {
    const r = convertLeadSchema.safeParse({ feePercent: 150 });
    expect(r.success).toBe(false);
  });
});

describe("createCaseSchema", () => {
  it("requires state length 2 and ownerName", () => {
    const r = createCaseSchema.safeParse({
      countyName: "Riverside",
      state: "California",
      ownerName: "",
    });
    expect(r.success).toBe(false);
  });
});

describe("createTaskSchema", () => {
  it("rejects when neither claimId nor leadId is present", () => {
    const r = createTaskSchema.safeParse({
      type: "CALL",
      title: "Follow up",
    });
    expect(r.success).toBe(false);
  });

  it("accepts when attached to a claim", () => {
    const r = createTaskSchema.safeParse({
      claimId: "ckxxxxxxxxxxxxxxxxxxxxxxx", // valid-shape cuid
      type: "CALL",
      title: "Follow up",
    });
    expect(r.success).toBe(true);
  });
});
