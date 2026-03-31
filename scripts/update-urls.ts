/**
 * Script to update county list URLs in the database.
 * Run with: npx tsx scripts/update-urls.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface CountyUrl {
  name: string;
  state: string;
  listUrl: string;
  source?: string;
  notes?: string;
  rulesText?: string;
  claimDeadline?: string;
}

// Real, verified county surplus funds URLs
const COUNTY_URLS: CountyUrl[] = [
  // California counties
  {
    name: 'Inyo',
    state: 'CA',
    listUrl: 'https://inyocounty.us/sites/default/files/Excess%20Proceeds%20Publication.pdf',
    source: 'County Treasurer PDF',
    notes: 'Publishes excess proceeds quarterly',
    rulesText: 'Per CA Revenue & Taxation Code §4675, excess proceeds from tax-defaulted property sales are available to prior owners. Claims must be filed within 1 year of the date of the tax deed.',
    claimDeadline: '1 year from tax deed date',
  },
  {
    name: 'Riverside',
    state: 'CA',
    listUrl: 'https://www.rscso.com/sites/default/files/uploads/Riverside-Dept/Sheriff/Unclaimed-Property.pdf',
    source: 'Sheriff unclaimed property PDF',
    notes: 'Sheriff foreclosure surplus funds',
    rulesText: 'CA Civil Code §2924k governs surplus from foreclosure sales. Contact Riverside County Sheriff Civil Bureau for claims.',
    claimDeadline: '30 days post-notice for priority claims',
  },
  {
    name: 'Shasta',
    state: 'CA',
    listUrl: 'https://www.shastacounty.gov/tax-collector/page/excess-proceeds',
    source: 'Tax Collector website',
    notes: 'Online excess proceeds page',
    rulesText: 'CA Rev & Tax Code §4675. File claim with Tax Collector. Priority to former owner, then lienholders.',
    claimDeadline: '1 year from recordation of tax deed',
  },
  {
    name: 'Tulare',
    state: 'CA',
    listUrl: 'https://tularecounty.ca.gov/treasurertaxcollector/index.cfm/tax-defaulted-land/excess-proceeds/',
    source: 'Treasurer-Tax Collector website',
    notes: 'Mail-in claim forms available',
    rulesText: 'CA Rev & Tax Code §4675. Submit claim form to Treasurer-Tax Collector office.',
    claimDeadline: '1 year from recordation of tax deed',
  },
  {
    name: 'Fresno',
    state: 'CA',
    listUrl: 'https://www.fresnocountyca.gov/Departments/Treasurer-Tax-Collector/Excess-Proceeds',
    source: 'Treasurer-Tax Collector website',
    notes: 'Tax excess proceeds from defaulted sales',
    rulesText: 'CA Rev & Tax Code §4675. Claims filed with Fresno County Treasurer-Tax Collector.',
    claimDeadline: '1 year from recordation of tax deed',
  },
  {
    name: 'Kern',
    state: 'CA',
    listUrl: 'https://www.kerncounty.com/government/treasurer-tax-collector/excess-proceeds',
    source: 'Treasurer-Tax Collector website',
    notes: 'Active tax-defaulted sales with excess proceeds',
    rulesText: 'CA Rev & Tax Code §4675. Contact Kern County Treasurer-Tax Collector.',
    claimDeadline: '1 year from recordation of tax deed',
  },
  {
    name: 'Amador',
    state: 'CA',
    listUrl: 'https://www.amadorgov.org/government/treasurer-tax-collector',
    source: 'Treasurer-Tax Collector website',
    notes: 'Rural county, contact treasurer for current lists',
    rulesText: 'CA Rev & Tax Code §4675. Small rural county - contact office directly.',
    claimDeadline: '1 year from recordation of tax deed',
  },
  {
    name: 'Calaveras',
    state: 'CA',
    listUrl: 'https://www.calaverasgov.us/departments/Treasurer-Tax-Collector',
    source: 'Treasurer-Tax Collector website',
    notes: 'Foreclosure activity; check treasurer page for current lists',
    rulesText: 'CA Rev & Tax Code §4675.',
    claimDeadline: '1 year from recordation of tax deed',
  },
  {
    name: 'Mariposa',
    state: 'CA',
    listUrl: 'https://www.mariposacounty.org/162/Treasurer-Tax-Collector',
    source: 'Treasurer-Tax Collector website',
    notes: 'Foreclosure overages; contact office for current list',
    rulesText: 'CA Rev & Tax Code §4675.',
    claimDeadline: '1 year from recordation of tax deed',
  },
  {
    name: 'Mono',
    state: 'CA',
    listUrl: 'https://monocounty.ca.gov/treasurer',
    source: 'Treasurer website',
    notes: 'Tax collector auctions; contact for excess proceeds',
    rulesText: 'CA Rev & Tax Code §4675.',
    claimDeadline: '1 year from recordation of tax deed',
  },
  {
    name: 'Trinity',
    state: 'CA',
    listUrl: 'https://www.trinitycounty.org/Tax-Collector',
    source: 'Tax Collector website',
    notes: 'Board approves distributions annually',
    rulesText: 'CA Rev & Tax Code §4675. Annual distribution cycle.',
    claimDeadline: '1 year from recordation of tax deed',
  },
  {
    name: 'Modoc',
    state: 'CA',
    listUrl: 'https://www.co.modoc.ca.us/departments/treasurer_tax_collector/index.php',
    source: 'Treasurer-Tax Collector website',
    notes: 'Low volume; owner priority',
    rulesText: 'CA Rev & Tax Code §4675.',
    claimDeadline: '1 year from recordation of tax deed',
  },
  {
    name: 'Sierra',
    state: 'CA',
    listUrl: 'https://www.sierracounty.ca.gov/200/Treasurer-Tax-Collector',
    source: 'Treasurer-Tax Collector website',
    notes: 'Rural tax defaults; simple claims process',
    rulesText: 'CA Rev & Tax Code §4675.',
    claimDeadline: '1 year from recordation of tax deed',
  },
  {
    name: 'Alpine',
    state: 'CA',
    listUrl: 'https://www.alpinecountyca.gov/209/Treasurer-Tax-Collector',
    source: 'Treasurer-Tax Collector website',
    notes: 'Smallest CA county; contact treasurer for lists',
    rulesText: 'CA Rev & Tax Code §4675.',
    claimDeadline: '1 year from recordation of tax deed',
  },
  {
    name: 'Colusa',
    state: 'CA',
    listUrl: 'https://www.countyofcolusa.org/149/Treasurer-Tax-Collector',
    source: 'Treasurer-Tax Collector website',
    notes: 'Tax-defaulted sales',
    rulesText: 'CA Rev & Tax Code §4675.',
    claimDeadline: '1 year from recordation of tax deed',
  },
];

async function main() {
  console.log(`Updating ${COUNTY_URLS.length} counties with real URLs...`);

  for (const county of COUNTY_URLS) {
    try {
      const result = await prisma.county.update({
        where: { name_state: { name: county.name, state: county.state } },
        data: {
          listUrl: county.listUrl,
          source: county.source,
          notes: county.notes,
          rulesText: county.rulesText,
          claimDeadline: county.claimDeadline,
        },
      });
      console.log(`  ✓ ${result.name}, ${result.state} → ${county.listUrl.substring(0, 60)}...`);
    } catch (e) {
      console.error(`  ✗ ${county.name}, ${county.state}: ${e}`);
    }
  }

  console.log('\nDone!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
