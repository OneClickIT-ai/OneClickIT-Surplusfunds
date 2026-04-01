/**
 * Scraper for state unclaimed property portals.
 *
 * Most state portals require name-based searches and return paginated results.
 * This scraper targets states that publish bulk lists or downloadable data.
 * For interactive-search-only portals, we provide direct links instead.
 *
 * Strategy:
 * 1. States with public CSV/PDF bulk downloads → parse directly
 * 2. States with HTML table listings → fetch + parse
 * 3. States with search-only portals → link to official portal
 */

export interface UnclaimedPropertyRecord {
  ownerName: string;
  propertyType: string;
  reportedAmount?: number;
  holderName?: string;
  address?: string;
  city?: string;
  zip?: string;
  reportedDate?: string;
  externalId?: string;
}

export interface ScrapeResult {
  success: boolean;
  records: UnclaimedPropertyRecord[];
  error?: string;
}

/**
 * Attempts to scrape unclaimed property data from a state portal.
 * Returns parsed records or an error.
 */
export async function scrapeStateUnclaimed(
  stateCode: string,
  searchUrl: string,
): Promise<ScrapeResult> {
  try {
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SurplusFundsBot/1.0)',
      },
      signal: AbortSignal.timeout(20000),
    });

    if (!response.ok) {
      return { success: false, records: [], error: `HTTP ${response.status}` };
    }

    const contentType = response.headers.get('content-type') || '';
    const text = await response.text();

    // CSV response
    if (contentType.includes('csv') || searchUrl.includes('.csv')) {
      return parseCsvUnclaimed(text);
    }

    // HTML with table data
    if (text.includes('<table')) {
      return parseHtmlTableUnclaimed(text);
    }

    // Page exists but no parseable data — this is expected for search-only portals
    return {
      success: true,
      records: [],
      error: 'Portal requires interactive search — use the direct link',
    };
  } catch (error) {
    return {
      success: false,
      records: [],
      error: error instanceof Error ? error.message : 'Scrape failed',
    };
  }
}

function parseCsvUnclaimed(text: string): ScrapeResult {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) {
    return { success: false, records: [], error: 'CSV has no data' };
  }

  const header = lines[0].toLowerCase().split(',').map(h => h.replace(/"/g, '').trim());
  const nameIdx = header.findIndex(h => /owner|name|claimant/.test(h));
  const typeIdx = header.findIndex(h => /type|category|property/.test(h));
  const amtIdx = header.findIndex(h => /amount|value|balance/.test(h));
  const holderIdx = header.findIndex(h => /holder|company|reporter|source/.test(h));
  const cityIdx = header.findIndex(h => /city|town/.test(h));

  const records: UnclaimedPropertyRecord[] = [];

  for (let i = 1; i < lines.length && records.length < 5000; i++) {
    const cols = lines[i].split(',').map(c => c.replace(/"/g, '').trim());
    const ownerName = cols[nameIdx >= 0 ? nameIdx : 0] || '';
    if (!ownerName || ownerName.length < 2) continue;

    const amountStr = amtIdx >= 0 ? cols[amtIdx] : undefined;
    const amount = amountStr ? parseFloat(amountStr.replace(/[$,]/g, '')) : undefined;

    records.push({
      ownerName,
      propertyType: typeIdx >= 0 ? cols[typeIdx] || 'Unknown' : 'Unknown',
      reportedAmount: amount && !isNaN(amount) ? amount : undefined,
      holderName: holderIdx >= 0 ? cols[holderIdx] : undefined,
      city: cityIdx >= 0 ? cols[cityIdx] : undefined,
    });
  }

  return { success: records.length > 0, records };
}

function parseHtmlTableUnclaimed(html: string): ScrapeResult {
  const records: UnclaimedPropertyRecord[] = [];

  const tables = html.match(/<table[\s\S]*?<\/table>/gi) || [];
  for (const table of tables) {
    const rows = table.match(/<tr[\s\S]*?<\/tr>/gi) || [];

    // Try to detect header row
    const headerRow = rows[0] || '';
    const headerCells = (headerRow.match(/<th[\s\S]*?<\/th>/gi) || [])
      .map(c => c.replace(/<[^>]+>/g, '').trim().toLowerCase());

    const nameIdx = headerCells.findIndex(h => /owner|name|claimant/.test(h));
    const typeIdx = headerCells.findIndex(h => /type|category|property/.test(h));
    const amtIdx = headerCells.findIndex(h => /amount|value|balance/.test(h));
    const holderIdx = headerCells.findIndex(h => /holder|company|reporter/.test(h));
    const cityIdx = headerCells.findIndex(h => /city|town/.test(h));

    const startRow = headerCells.length > 0 ? 1 : 0;

    for (let i = startRow; i < rows.length && records.length < 5000; i++) {
      const cells = (rows[i].match(/<td[\s\S]*?<\/td>/gi) || [])
        .map(c => c.replace(/<[^>]+>/g, '').replace(/&[a-z]+;/gi, ' ').trim());

      if (cells.length < 2) continue;

      const ownerName = cells[nameIdx >= 0 ? nameIdx : 0] || '';
      if (!ownerName || ownerName.length < 2) continue;
      if (/^(name|owner|property)/i.test(ownerName)) continue;

      const amountStr = amtIdx >= 0 ? cells[amtIdx] : undefined;
      const amount = amountStr ? parseFloat(amountStr.replace(/[$,]/g, '')) : undefined;

      records.push({
        ownerName,
        propertyType: typeIdx >= 0 ? cells[typeIdx] || 'Unknown' : 'Unknown',
        reportedAmount: amount && !isNaN(amount) ? amount : undefined,
        holderName: holderIdx >= 0 ? cells[holderIdx] : undefined,
        city: cityIdx >= 0 ? cells[cityIdx] : undefined,
      });
    }
  }

  return { success: records.length > 0, records };
}
