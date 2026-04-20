/**
 * Per-state surplus funds claim requirements.
 * Statutes, deadlines, required documents, filing offices, and fee caps.
 *
 * easyRating: 1 = easiest (no court, short docs, clear deadline, fast processing)
 *             2 = moderate
 *             3 = hardest (court petition required or complex)
 */

export interface StateRequirements {
  state: string;
  stateName: string;
  statute: string;
  deadlineDays: number | null; // null = no statutory deadline
  deadlineDesc: string;
  filingOffice: string;
  requiredDocs: string[];
  optionalDocs: string[];
  feeCapPercent: number | null; // max % a recovery agent can charge, null = no cap
  feeCapNotes: string;
  processTime: string;
  notes: string;
  requiresCourt: boolean;
  agentLicenseRequired: boolean;
  easyRating: 1 | 2 | 3;
}

export const STATE_REQUIREMENTS: Record<string, StateRequirements> = {
  CA: {
    state: 'CA',
    stateName: 'California',
    statute: 'CA Revenue & Tax Code §4675–4676',
    deadlineDays: 365,
    deadlineDesc: '1 year from date of recorded tax deed',
    filingOffice: 'County Treasurer-Tax Collector',
    requiredDocs: [
      'Claim form (county-specific)',
      'Government-issued photo ID',
      'Proof of ownership (recorded deed or title)',
      'Tax bill or parcel number documentation',
    ],
    optionalDocs: [
      'Death certificate (if heir)',
      'Probate court order (if estate)',
      'Assignment of rights (if filing on behalf of owner)',
      'Power of attorney',
    ],
    feeCapPercent: null,
    feeCapNotes: 'No statutory fee cap for recovery agents in CA',
    processTime: '30–90 days after Board of Supervisors approval',
    notes: 'Board of Supervisors must approve. Some counties have a 90-day dispute period.',
    requiresCourt: false,
    agentLicenseRequired: false,
    easyRating: 1,
  },
  TX: {
    state: 'TX',
    stateName: 'Texas',
    statute: 'TX Tax Code §34.04',
    deadlineDays: 730,
    deadlineDesc: '2 years from date of tax sale',
    filingOffice: 'District Clerk of the county where property is located',
    requiredDocs: [
      'Petition to the court (required — must file a lawsuit)',
      'Government-issued photo ID',
      'Certified copy of deed',
      'Tax sale documentation',
    ],
    optionalDocs: [
      'Affidavit of heirship',
      'Probate documents',
      'Assignment agreement',
    ],
    feeCapPercent: null,
    feeCapNotes: 'No statutory fee cap, but court may review reasonableness of fees',
    processTime: '60–120 days after court hearing',
    notes: 'Texas requires a court petition — not just an administrative claim. Attorney often needed.',
    requiresCourt: true,
    agentLicenseRequired: true,
    easyRating: 3,
  },
  FL: {
    state: 'FL',
    stateName: 'Florida',
    statute: 'FL Statutes §197.522',
    deadlineDays: 120,
    deadlineDesc: '120 days from date of tax deed issuance',
    filingOffice: 'Clerk of the Circuit Court',
    requiredDocs: [
      'Surplus funds claim application',
      'Government-issued photo ID',
      'Proof of interest (deed, mortgage, lien)',
      'Notarized claim form',
    ],
    optionalDocs: [
      'Title search results',
      'Probate/estate documents',
      'Assignment of claim',
    ],
    feeCapPercent: null,
    feeCapNotes: 'FL does not cap recovery fees, but some counties require disclosure',
    processTime: '30–60 days',
    notes: 'Short 120-day window. Clerk distributes funds in order of priority of liens.',
    requiresCourt: false,
    agentLicenseRequired: false,
    easyRating: 1,
  },
  GA: {
    state: 'GA',
    stateName: 'Georgia',
    statute: 'GA Code §48-4-5',
    deadlineDays: 365,
    deadlineDesc: '1 year from date of tax sale',
    filingOffice: 'Tax Commissioner or County Tax Office',
    requiredDocs: [
      'Written claim to Tax Commissioner',
      'Government-issued photo ID',
      'Proof of former ownership',
      'Notarized affidavit',
    ],
    optionalDocs: [
      'Heir documentation',
      'Assignment of rights',
    ],
    feeCapPercent: null,
    feeCapNotes: 'No statutory fee cap',
    processTime: '30–90 days',
    notes: 'Excess funds held by Tax Commissioner. After 1 year, funds may escheat to the state.',
    requiresCourt: false,
    agentLicenseRequired: false,
    easyRating: 1,
  },
  OH: {
    state: 'OH',
    stateName: 'Ohio',
    statute: 'OH Rev. Code §5723.12',
    deadlineDays: null,
    deadlineDesc: 'No specific statutory deadline, but claims should be filed promptly',
    filingOffice: 'County Auditor or County Treasurer',
    requiredDocs: [
      'Surplus funds claim form',
      'Government-issued photo ID',
      'Proof of ownership or lien interest',
    ],
    optionalDocs: [
      'Title evidence',
      'Estate/probate documents',
    ],
    feeCapPercent: null,
    feeCapNotes: 'No statutory fee cap',
    processTime: '30–60 days',
    notes: 'Process varies by county. Contact the County Auditor for specific procedures.',
    requiresCourt: false,
    agentLicenseRequired: false,
    easyRating: 2,
  },
  AZ: {
    state: 'AZ',
    stateName: 'Arizona',
    statute: 'AZ Rev. Stat. §42-18303',
    deadlineDays: null,
    deadlineDesc: 'No fixed deadline; excess proceeds held by County Treasurer',
    filingOffice: 'County Treasurer',
    requiredDocs: [
      'Written claim to County Treasurer',
      'Government-issued photo ID',
      'Proof of former ownership',
    ],
    optionalDocs: [
      'Lien documentation',
      'Estate/heir documents',
    ],
    feeCapPercent: null,
    feeCapNotes: 'No statutory fee cap',
    processTime: '30–60 days',
    notes: 'Treasurer holds excess proceeds. Contact County Treasurer directly.',
    requiresCourt: false,
    agentLicenseRequired: false,
    easyRating: 2,
  },
  MI: {
    state: 'MI',
    stateName: 'Michigan',
    statute: 'MI Comp. Laws §211.78t (Rafaeli decision)',
    deadlineDays: null,
    deadlineDesc: 'File claim within reasonable time; check county-specific deadlines',
    filingOffice: 'County Treasurer',
    requiredDocs: [
      'Claim form (county-specific)',
      'Government-issued photo ID',
      'Proof of ownership at time of foreclosure',
    ],
    optionalDocs: [
      'Title search',
      'Estate documents',
    ],
    feeCapPercent: null,
    feeCapNotes: 'Post-Rafaeli: counties must return surplus. No fee cap.',
    processTime: '60–120 days',
    notes: 'After the 2023 Rafaeli Supreme Court decision, MI counties must return surplus from tax foreclosures.',
    requiresCourt: false,
    agentLicenseRequired: false,
    easyRating: 2,
  },
  MD: {
    state: 'MD',
    stateName: 'Maryland',
    statute: 'MD Tax-Property §14-820',
    deadlineDays: null,
    deadlineDesc: 'Check county-specific deadlines',
    filingOffice: 'Circuit Court or County Finance Office',
    requiredDocs: [
      'Written claim / petition',
      'Government-issued photo ID',
      'Proof of interest in property',
    ],
    optionalDocs: [
      'Title search',
      'Lien documentation',
    ],
    feeCapPercent: null,
    feeCapNotes: 'No statutory fee cap',
    processTime: '30–90 days',
    notes: 'Process varies significantly by county in MD.',
    requiresCourt: false,
    agentLicenseRequired: false,
    easyRating: 2,
  },
  NY: {
    state: 'NY',
    stateName: 'New York',
    statute: 'NY Real Property Tax Law §1136',
    deadlineDays: null,
    deadlineDesc: 'Must file within statutory period; check county-specific rules',
    filingOffice: 'County Comptroller or County Treasurer',
    requiredDocs: [
      'Surplus funds claim application',
      'Government-issued photo ID',
      'Proof of former ownership or lien',
    ],
    optionalDocs: [
      'Title report',
      'Estate/probate documents',
    ],
    feeCapPercent: null,
    feeCapNotes: 'No statutory fee cap',
    processTime: '60–120 days',
    notes: 'NYC and some counties have their own specific surplus funds procedures.',
    requiresCourt: true,
    agentLicenseRequired: false,
    easyRating: 3,
  },
  CO: {
    state: 'CO',
    stateName: 'Colorado',
    statute: 'CO Rev. Stat. §39-11-151',
    deadlineDays: null,
    deadlineDesc: 'Check county-specific deadlines',
    filingOffice: 'County Treasurer',
    requiredDocs: [
      'Written claim to County Treasurer',
      'Government-issued photo ID',
      'Proof of ownership',
    ],
    optionalDocs: [
      'Estate documents',
      'Assignment agreement',
    ],
    feeCapPercent: null,
    feeCapNotes: 'No statutory fee cap',
    processTime: '30–60 days',
    notes: 'Surplus funds procedures vary by county.',
    requiresCourt: false,
    agentLicenseRequired: false,
    easyRating: 2,
  },
};

const STATE_NAMES: Record<string, string> = {
  AL: 'Alabama', AK: 'Alaska', AR: 'Arkansas', CT: 'Connecticut', DE: 'Delaware',
  HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa',
  KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine',
  MA: 'Massachusetts', MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri',
  MT: 'Montana', NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey',
  NM: 'New Mexico', NC: 'North Carolina', ND: 'North Dakota',
  OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island',
  SC: 'South Carolina', SD: 'South Dakota', TN: 'Tennessee', UT: 'Utah',
  VT: 'Vermont', VA: 'Virginia', WA: 'Washington', WV: 'West Virginia',
  WI: 'Wisconsin', WY: 'Wyoming',
};

function stubState(
  state: string,
  overrides: Partial<StateRequirements> = {},
): StateRequirements {
  return {
    state,
    stateName: STATE_NAMES[state] || state,
    statute: overrides.statute ?? 'See state tax / foreclosure code',
    deadlineDays: overrides.deadlineDays ?? null,
    deadlineDesc: overrides.deadlineDesc ?? 'Check county-specific deadlines',
    filingOffice: overrides.filingOffice ?? 'County Treasurer or Clerk',
    requiredDocs: overrides.requiredDocs ?? [
      'Written claim form',
      'Government-issued photo ID',
      'Proof of ownership or lien interest',
    ],
    optionalDocs: overrides.optionalDocs ?? ['Estate/probate documents', 'Assignment of rights'],
    feeCapPercent: overrides.feeCapPercent ?? null,
    feeCapNotes: overrides.feeCapNotes ?? 'No statutory fee cap',
    processTime: overrides.processTime ?? '30–90 days',
    notes: overrides.notes ?? 'Surplus-funds procedures vary by county; contact the county directly.',
    requiresCourt: overrides.requiresCourt ?? false,
    agentLicenseRequired: overrides.agentLicenseRequired ?? false,
    easyRating: overrides.easyRating ?? 2,
  };
}

// Fill out the remaining 40 states with conservative defaults.
Object.assign(STATE_REQUIREMENTS, {
  AL: stubState('AL', { requiresCourt: true, easyRating: 3, notes: 'Alabama often requires judicial proceedings for surplus distribution.' }),
  AK: stubState('AK'),
  AR: stubState('AR'),
  CT: stubState('CT'),
  DE: stubState('DE'),
  HI: stubState('HI'),
  ID: stubState('ID', { easyRating: 1 }),
  IL: stubState('IL', { easyRating: 2 }),
  IN: stubState('IN', { easyRating: 2 }),
  IA: stubState('IA'),
  KS: stubState('KS'),
  KY: stubState('KY'),
  LA: stubState('LA'),
  ME: stubState('ME'),
  MA: stubState('MA', { requiresCourt: true, easyRating: 3, notes: 'MA foreclosure surplus typically routed through Land Court.' }),
  MN: stubState('MN', { easyRating: 1 }),
  MS: stubState('MS'),
  MO: stubState('MO'),
  MT: stubState('MT'),
  NE: stubState('NE'),
  NV: stubState('NV'),
  NH: stubState('NH'),
  NJ: stubState('NJ', { requiresCourt: true, easyRating: 3, notes: 'NJ surplus claims typically filed with the Superior Court.' }),
  NM: stubState('NM'),
  NC: stubState('NC', { easyRating: 2 }),
  ND: stubState('ND'),
  OK: stubState('OK'),
  OR: stubState('OR'),
  PA: stubState('PA', { easyRating: 2 }),
  RI: stubState('RI', { requiresCourt: true, easyRating: 3 }),
  SC: stubState('SC'),
  SD: stubState('SD'),
  TN: stubState('TN', { requiresCourt: true, easyRating: 3, notes: 'TN Chancery Court typically handles surplus distribution.' }),
  UT: stubState('UT'),
  VT: stubState('VT'),
  VA: stubState('VA'),
  WA: stubState('WA', { easyRating: 1 }),
  WV: stubState('WV'),
  WI: stubState('WI', { easyRating: 1 }),
  WY: stubState('WY'),
});

/** Return states ranked easiest (rating 1) for lead prioritization. */
export function getEasyStates(): StateRequirements[] {
  return Object.values(STATE_REQUIREMENTS).filter((s) => s.easyRating === 1);
}

export function getStateRequirements(stateCode: string): StateRequirements | null {
  return STATE_REQUIREMENTS[stateCode] || null;
}

export function getAllStateRequirements(): StateRequirements[] {
  return Object.values(STATE_REQUIREMENTS);
}
