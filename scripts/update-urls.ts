/**
 * Script to update county list URLs in the database with researched, verified URLs.
 * Run with: npx tsx scripts/update-urls.ts
 * Last researched: 2026-03-31
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

const COUNTY_URLS: CountyUrl[] = [
  // === BEST: Dedicated excess proceeds pages with PDFs ===
  {
    name: 'Mono',
    state: 'CA',
    listUrl: 'https://monocounty.ca.gov/tax/page/property-tax-auction-excess-proceeds',
    source: 'Dedicated excess proceeds page with PDFs',
    notes: 'Downloadable claim form + excess proceeds lists (Nov 2023, Feb 2024 PDFs confirmed). Contact: 760-932-5480, treasurer@mono.ca.gov',
    rulesText: 'CA Rev & Tax Code §4675. Claim deadline: 1 year from deed recording. Downloadable claim form on county site.',
    claimDeadline: '1 year from deed recording',
  },
  {
    name: 'Mariposa',
    state: 'CA',
    listUrl: 'https://www.mariposacounty.gov/1748/Publications',
    source: 'Annual excess proceeds publication PDFs (2018-2025)',
    notes: 'Sep 2025 latest PDF. Direct PDF: /DocumentCenter/View/100928/EXCESS-PROCEEDS-Publication-2025-PDF. Contact: 209-966-2621',
    rulesText: 'CA Rev & Tax Code §4675. Annual publication of excess proceeds. File claim with Treasurer-Tax Collector.',
    claimDeadline: '1 year from deed recording',
  },
  {
    name: 'Modoc',
    state: 'CA',
    listUrl: 'https://www.co.modoc.ca.us/departments/tax_collector/publications.php',
    source: 'Notice of Right to Claim Excess Proceeds PDFs (2019-2025)',
    notes: 'Uses Bid4Assets for auctions. Contact: 530-233-6223',
    rulesText: 'CA Rev & Tax Code §4675. Annual "Notice of Right to Claim Excess Proceeds" published.',
    claimDeadline: '1 year from deed recording',
  },
  {
    name: 'Shasta',
    state: 'CA',
    listUrl: 'https://www.shastacounty.gov/tax-collector/page/excess-proceeds',
    source: 'Dedicated excess proceeds page with claim forms',
    notes: 'One of the best-organized CA county pages for excess proceeds. Also see /tax-collector/page/tax-defaulted-property',
    rulesText: 'CA Rev & Tax Code §4675. Claim forms available on dedicated page.',
    claimDeadline: '1 year from deed recording',
  },
  {
    name: 'Fresno',
    state: 'CA',
    listUrl: 'https://www.fresnocountyca.gov/Departments/Auditor-Controller-Treasurer-Tax-Collector/Property-Tax-Information/Tax-Sale-Excess-Proceeds',
    source: 'Dedicated page with direct PDF excess proceed lists',
    notes: 'Has direct PDF links (e.g. march-27-28-april-4-2025-excess-proceed-list.pdf). Managed by Auditor-Controller/Treasurer-Tax Collector',
    rulesText: 'CA Rev & Tax Code §4675. Direct PDF links to current excess proceed lists.',
    claimDeadline: '1 year from deed recording',
  },
  {
    name: 'Trinity',
    state: 'CA',
    listUrl: 'https://www.trinitycounty.org/438/Treasurer-Tax-Collector',
    source: 'Tax Sale Excess Proceeds Claim Form PDFs (Jul 2024, Jun 2024)',
    notes: 'Board approves distribution annually. Uses GovEase for auctions. Contact: 530-623-1251, 11 Court St, Weaverville CA 96093',
    rulesText: 'CA Rev & Tax Code §4675. Board of Supervisors approves distribution annually.',
    claimDeadline: '1 year from deed recording',
  },
  {
    name: 'Inyo',
    state: 'CA',
    listUrl: 'https://inyocounty.us/sites/default/files/Excess%20Proceeds%20Publication.pdf',
    source: 'Direct PDF of excess proceeds publication',
    notes: '14 real properties confirmed in scrape test (APNs, claimant names). Published quarterly',
    rulesText: 'CA Rev & Tax Code §4675. Direct PDF download of current excess proceeds.',
    claimDeadline: '1 year from deed recording',
  },
  // === GOOD: Tax sale pages with excess proceeds info ===
  {
    name: 'Tulare',
    state: 'CA',
    listUrl: 'https://tularecounty.ca.gov/treasurertaxcollector/tax-collector/tax-auction',
    source: 'Tax auction hub with per-year excess proceeds sub-pages',
    notes: 'Sub-pages for each year (e.g. /2020-tax-auction/2020-tax-auction-excess-proceeds/). Unclaimed monies: /treasurer/unclaimed-monies. Contact: Taxhelp@tularecounty.ca.gov, 877-736-9055',
    rulesText: 'CA Rev & Tax Code §4675. Per-year excess proceeds pages available.',
    claimDeadline: '1 year from deed recording',
  },
  {
    name: 'Kern',
    state: 'CA',
    listUrl: 'https://www.kerncounty.com/services/property-land-and-taxes/property-tax-portal/tax-defaulted-property-sales',
    source: 'Report of Sale + claim form PDF',
    notes: 'Claim form at kcttc.co.kern.ca.us/Forms/CLAIM FOR EXCESS PROCEEDS.pdf. Treasurer-Tax Collector: Jordan Kaufman',
    rulesText: 'CA Rev & Tax Code §4675. Claim form PDF available on legacy portal.',
    claimDeadline: '1 year from deed recording',
  },
  {
    name: 'Colusa',
    state: 'CA',
    listUrl: 'https://www.countyofcolusaca.gov/753/Sale-of-Tax-Defaulted-Property',
    source: 'Tax defaulted property sale page with claim instructions',
    notes: 'Instructions doc at /DocumentCenter/View/19633. Results at /770/Results. Contact: 530-458-0440, 547 Market St Suite 111, Colusa CA 95932',
    rulesText: 'CA Rev & Tax Code §4675.',
    claimDeadline: '1 year from deed recording',
  },
  {
    name: 'Amador',
    state: 'CA',
    listUrl: 'https://www.amadorcounty.gov/government/treasurer-tax-collector/publications',
    source: 'Publications page with notices + claim form/checklist',
    notes: 'Also see /forms for Excess Proceeds Claim Form. Uses Bid4Assets. Contact: 209-223-6364, 810 Court St, Jackson CA 95642',
    rulesText: 'CA Rev & Tax Code §4675. Notice of Right to Claim published on publications page.',
    claimDeadline: '1 year from deed recording',
  },
  {
    name: 'Riverside',
    state: 'CA',
    listUrl: 'https://countytreasurer.org/tax-collector/tax-sale-information',
    source: 'Tax sale info via countytreasurer.org',
    notes: 'Tax sale results at /tax-sale-results. Excess proceeds via Board of Supervisors. Note: old rscso.com URL was Sheriff unclaimed property, NOT tax sale excess proceeds. Contact: 951-955-3900',
    rulesText: 'CA Rev & Tax Code §4675 for tax sales. CA Civil Code §2924k for foreclosure surplus.',
    claimDeadline: '1 year from deed recording (tax), 30 days post-notice (foreclosure)',
  },
  // === CONTACT-ONLY ===
  {
    name: 'Alpine',
    state: 'CA',
    listUrl: 'https://alpinecountyca.gov/353/Treasurer-Tax-Collector',
    source: 'Treasurer-Tax Collector (contact only)',
    notes: 'No dedicated excess proceeds page. Too small (~1100 pop). Documents may be in /DocumentCenter/Index/65. Contact: 530-694-2286, 99 Water St, Markleeville CA 96120',
    rulesText: 'CA Rev & Tax Code §4675. Contact treasurer directly.',
    claimDeadline: '1 year from deed recording',
  },
  {
    name: 'Sierra',
    state: 'CA',
    listUrl: 'https://www.sierracounty.ca.gov/314/Property-Tax-Sales',
    source: 'Tax sales page (no dedicated excess proceeds)',
    notes: 'Auction info via GovEase (liveauctions.govease.com). Contact Tax Collector for claim details. Pop ~3200',
    rulesText: 'CA Rev & Tax Code §4675.',
    claimDeadline: '1 year from deed recording',
  },
  {
    name: 'Calaveras',
    state: 'CA',
    listUrl: 'https://taxcollector.calaverasgov.us/Auctions',
    source: 'Auctions page (excess proceeds published post-sale)',
    notes: 'Contact CalaverasTaxSales@gmail.com. Uses Bid4Assets. Notices may be in local newspaper only',
    rulesText: 'CA Rev & Tax Code §4675.',
    claimDeadline: '1 year from deed recording',
  },
  // === NON-CA COUNTIES ===
  {
    name: 'Loving',
    state: 'TX',
    listUrl: 'https://www.claimittexas.gov/',
    source: 'TX state unclaimed property portal (no county website)',
    notes: 'Pop ~120, smallest TX county. No county website exists. TX Tax Code §34.04: excess held by district clerk court registry for 2 years',
    rulesText: 'TX Tax Code §34.04. Excess proceeds held by district clerk court registry for 2 years.',
    claimDeadline: '2 years from tax sale',
  },
  {
    name: 'Sumter',
    state: 'FL',
    listUrl: 'https://www.sumterclerk.com/surplus-funds-list',
    source: 'Clerk of Courts surplus funds list (two PDFs)',
    notes: 'Registry & Foreclosure Sales Surplus + Tax Deed Sales Surplus (PDF via Google Docs viewer). Claim affidavit form available. Contact Finance: 352-569-6600',
    rulesText: 'FL Statute §45.032 (foreclosure) and §197.582 (tax deed). 90-day claim window after auction.',
    claimDeadline: '90 days after auction',
  },
  {
    name: 'Carroll',
    state: 'MD',
    listUrl: 'https://www.carrollcountymd.gov/government/directory/comptroller/collectionstaxes/surplus-funds-list/',
    source: 'Comptroller HTML table of surplus funds',
    notes: '40 property entries totaling $67,983.98. Includes property IDs, owner names, bid amounts, balances. 225 N Center St, Westminster MD 21157, 410-386-2400',
    rulesText: 'MD Tax-Property Article §14-820. Surplus from tax sales payable to former owner.',
    claimDeadline: 'Contact Comptroller',
  },
];

async function main() {
  console.log(`Updating ${COUNTY_URLS.length} counties with verified URLs...`);

  let updated = 0;
  let created = 0;
  for (const county of COUNTY_URLS) {
    try {
      const result = await prisma.county.upsert({
        where: { name_state: { name: county.name, state: county.state } },
        update: {
          listUrl: county.listUrl,
          source: county.source,
          notes: county.notes,
          rulesText: county.rulesText,
          claimDeadline: county.claimDeadline,
        },
        create: {
          rank: 99,
          name: county.name,
          state: county.state,
          population: 0,
          listUrl: county.listUrl,
          source: county.source,
          notes: county.notes,
          rulesText: county.rulesText,
          claimDeadline: county.claimDeadline,
        },
      });
      console.log(`  ✓ ${result.name}, ${result.state}`);
      updated++;
    } catch (e) {
      console.error(`  ✗ ${county.name}, ${county.state}: ${e}`);
    }
  }

  console.log(`\nDone! Updated ${updated} counties.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
