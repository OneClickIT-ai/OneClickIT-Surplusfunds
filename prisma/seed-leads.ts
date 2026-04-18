/**
 * Demo SurplusLead seed. Idempotent — upserts by (parcelId, countyId) unique
 * constraint. Run after `seed.ts` has populated counties.
 *
 *   npx tsx prisma/seed-leads.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEMO_ROWS: Array<{
  countyMatch: { name: string; state: string };
  ownerName: string;
  parcelId: string;
  propertyAddr: string;
  surplusAmount: number;
  deadlineDate: Date;
  claimant?: { phone?: string; email?: string };
  score: number;
}> = [
  {
    countyMatch: { name: "Riverside", state: "CA" },
    ownerName: "JAMES R WILSON",
    parcelId: "RIV-2023-01847",
    propertyAddr: "1423 Orange Blossom Dr, Riverside, CA 92503",
    surplusAmount: 42850.0,
    deadlineDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
    claimant: { phone: "9515550142", email: "jwilson@example.com" },
    score: 78,
  },
  {
    countyMatch: { name: "Fresno", state: "CA" },
    ownerName: "MARIA GONZALES",
    parcelId: "FRE-2024-00921",
    propertyAddr: "8812 E Shields Ave, Fresno, CA 93703",
    surplusAmount: 18420.5,
    deadlineDate: new Date(Date.now() + 62 * 24 * 60 * 60 * 1000),
    claimant: { phone: "5595550198" },
    score: 62,
  },
  {
    countyMatch: { name: "Kern", state: "CA" },
    ownerName: "THOMAS & LINDA CHEN",
    parcelId: "KRN-2024-03217",
    propertyAddr: "2207 Oleander Ave, Bakersfield, CA 93304",
    surplusAmount: 91200.0,
    deadlineDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000),
    score: 88,
  },
  {
    countyMatch: { name: "Tulare", state: "CA" },
    ownerName: "ROBERT K PATEL",
    parcelId: "TUL-2023-00445",
    propertyAddr: "917 S Mooney Blvd, Visalia, CA 93277",
    surplusAmount: 7820.33,
    deadlineDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    claimant: { email: "rpatel@example.com" },
    score: 41,
  },
  {
    countyMatch: { name: "Sumter", state: "FL" },
    ownerName: "ESTATE OF HELEN MOORE",
    parcelId: "SUM-2024-02112",
    propertyAddr: "42 Bayside Ln, Wildwood, FL 34785",
    surplusAmount: 56700.0,
    deadlineDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
    score: 95,
  },
  {
    countyMatch: { name: "Carroll", state: "MD" },
    ownerName: "DAVID A BROOKS",
    parcelId: "CAR-2024-00733",
    propertyAddr: "118 Maple Ridge Rd, Westminster, MD 21157",
    surplusAmount: 33500.0,
    deadlineDate: new Date(Date.now() + 52 * 24 * 60 * 60 * 1000),
    claimant: { phone: "4105550119", email: "dbrooks@example.com" },
    score: 70,
  },
];

async function main() {
  console.log(`Seeding ${DEMO_ROWS.length} demo leads...`);
  let upserted = 0;
  let skipped = 0;

  for (const row of DEMO_ROWS) {
    const county = await prisma.county.findUnique({
      where: {
        name_state: { name: row.countyMatch.name, state: row.countyMatch.state },
      },
    });
    if (!county) {
      console.warn(
        `  skip ${row.ownerName} — county ${row.countyMatch.name}/${row.countyMatch.state} not found`,
      );
      skipped++;
      continue;
    }

    const lead = await prisma.surplusLead.upsert({
      where: {
        parcelId_countyId: { parcelId: row.parcelId, countyId: county.id },
      },
      create: {
        countyId: county.id,
        ownerName: row.ownerName,
        parcelId: row.parcelId,
        propertyAddr: row.propertyAddr,
        surplusAmount: row.surplusAmount,
        deadlineDate: row.deadlineDate,
        score: row.score,
        source: "demo_seed",
        status: "NEW",
      },
      update: {
        surplusAmount: row.surplusAmount,
        deadlineDate: row.deadlineDate,
        score: row.score,
      },
    });

    if (row.claimant && (row.claimant.phone || row.claimant.email)) {
      const existing = await prisma.claimant.findFirst({
        where: { leadId: lead.id },
        select: { id: true },
      });
      if (existing) {
        await prisma.claimant.update({
          where: { id: existing.id },
          data: {
            fullName: row.ownerName,
            phone: row.claimant.phone ?? null,
            email: row.claimant.email ?? null,
            address: row.propertyAddr,
          },
        });
      } else {
        await prisma.claimant.create({
          data: {
            leadId: lead.id,
            fullName: row.ownerName,
            phone: row.claimant.phone,
            email: row.claimant.email,
            address: row.propertyAddr,
          },
        });
      }
    }

    upserted++;
  }

  console.log(`✓ Seeded ${upserted} leads (skipped ${skipped})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
