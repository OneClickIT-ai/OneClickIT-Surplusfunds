import { FundEntry } from '@/types';
import { checkFetchUrl } from './url-safety';

export interface ScraperResult {
  success: boolean;
  funds: FundEntry[];
  error?: string;
}

/**
 * Scrapes a county surplus funds list from a URL.
 * Supports HTML tables, CSV files, and PDF pages.
 * Uses puppeteer-core + @sparticuz/chromium for serverless compatibility.
 */
export async function scrapeCounty(url: string): Promise<ScraperResult> {
  const safety = checkFetchUrl(url);
  if (!safety.ok) {
    return { success: false, funds: [], error: `unsafe URL: ${safety.reason}` };
  }
  const lower = url.toLowerCase();

  // CSV files — fetch and parse directly
  if (lower.includes('.csv') || lower.includes('format=csv') || lower.includes('type=csv')) {
    return scrapeCsv(url);
  }

  // PDF files
  if (lower.includes('.pdf') || lower.includes('filetype=pdf')) {
    return scrapePdf(url);
  }

  // HTML — try fetch first (faster, no browser needed), fallback to puppeteer
  const fetchResult = await scrapeHtmlFetch(url);
  if (fetchResult.success && fetchResult.funds.length > 0) {
    return fetchResult;
  }

  // Fallback to puppeteer for JS-rendered pages
  return scrapeHtmlPuppeteer(url);
}

/**
 * Lightweight HTML scraper using fetch + regex (no browser needed).
 * Works for static HTML pages with table data.
 */
async function scrapeHtmlFetch(url: string): Promise<ScraperResult> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SurplusFundsBot/1.0; +https://surplusfunds.app/bot)',
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      return { success: false, funds: [], error: `HTTP ${response.status}` };
    }

    const html = await response.text();
    const funds: FundEntry[] = [];

    // Extract table rows
    const tableMatch = html.match(/<table[\s\S]*?<\/table>/gi);
    if (tableMatch) {
      for (const table of tableMatch) {
        const rows = table.match(/<tr[\s\S]*?<\/tr>/gi) || [];
        for (const row of rows) {
          const cells = row.match(/<td[\s\S]*?<\/td>/gi) || [];
          if (cells.length >= 2) {
            const strip = (html: string) => html.replace(/<[^>]+>/g, '').replace(/&[a-z]+;/gi, ' ').trim();
            const property = cells[0] ? strip(cells[0]) : '';
            if (property && !property.match(/^(property|address|parcel|#|no\.|name)/i)) {
              funds.push({
                property,
                amount: cells[1] ? strip(cells[1]) : undefined,
                claimant: cells[2] ? strip(cells[2]) : undefined,
                date: cells[3] ? strip(cells[3]) : undefined,
              });
            }
          }
        }
      }
    }

    // Also try definition lists, divs with specific patterns
    if (funds.length === 0) {
      // Look for patterns like "Property: X" "Amount: $Y" in text
      const lines = html.replace(/<[^>]+>/g, '\n').split('\n').map(l => l.trim()).filter(Boolean);
      let currentEntry: Partial<FundEntry> = {};

      for (const line of lines) {
        const amountMatch = line.match(/\$[\d,]+\.?\d*/);
        const propertyMatch = line.match(/^(\d+\s+[\w\s]+(?:St|Ave|Rd|Dr|Ln|Blvd|Way|Ct))/i);

        if (propertyMatch && amountMatch) {
          funds.push({
            property: propertyMatch[1],
            amount: amountMatch[0],
          });
        } else if (propertyMatch) {
          if (currentEntry.property) {
            funds.push({ property: currentEntry.property, amount: currentEntry.amount, claimant: currentEntry.claimant });
          }
          currentEntry = { property: propertyMatch[1] };
        } else if (amountMatch && currentEntry.property) {
          currentEntry.amount = amountMatch[0];
        }
      }
      if (currentEntry.property) {
        funds.push({ property: currentEntry.property, amount: currentEntry.amount, claimant: currentEntry.claimant });
      }
    }

    return { success: funds.length > 0, funds };
  } catch (error) {
    return { success: false, funds: [], error: error instanceof Error ? error.message : 'Fetch failed' };
  }
}

/**
 * Full browser scraper for JS-rendered pages.
 */
async function scrapeHtmlPuppeteer(url: string): Promise<ScraperResult> {
  let puppeteer: typeof import('puppeteer-core');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let chromium: any;

  try {
    puppeteer = await import('puppeteer-core');
    chromium = (await import('@sparticuz/chromium')).default;
  } catch {
    return { success: false, funds: [], error: 'Scraper dependencies not available' };
  }

  let browser;
  try {
    browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true,
    });

    const page = await browser.newPage();
    await page.setUserAgent(
      'Mozilla/5.0 (compatible; SurplusFundsBot/1.0; +https://surplusfunds.app/bot)'
    );
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

    const funds = await page.evaluate(() => {
      const results: Array<{ property: string; amount?: string; claimant?: string; date?: string }> = [];

      // Try table rows
      const rows = Array.from(document.querySelectorAll('table tr'));
      for (const row of rows) {
        const cells = row.querySelectorAll('td');
        if (cells.length >= 2) {
          const property = cells[0]?.textContent?.trim() || '';
          if (property && !property.match(/^(property|address|parcel|#|no\.|name)/i)) {
            results.push({
              property,
              amount: cells[1]?.textContent?.trim() || '',
              claimant: cells[2]?.textContent?.trim() || '',
              date: cells[3]?.textContent?.trim() || '',
            });
          }
        }
      }

      // Try list items if no table data
      if (results.length === 0) {
        const items = Array.from(document.querySelectorAll('li, .fund-item, .surplus-item, [class*="fund"], [class*="surplus"]'));
        for (const item of items) {
          const text = item.textContent?.trim() || '';
          const amountMatch = text.match(/\$[\d,]+\.?\d*/);
          if (amountMatch && text.length > 10) {
            results.push({
              property: text.replace(amountMatch[0], '').trim().substring(0, 200),
              amount: amountMatch[0],
            });
          }
        }
      }

      return results;
    });

    return { success: true, funds };
  } catch (error) {
    return {
      success: false,
      funds: [],
      error: error instanceof Error ? error.message : 'Scrape failed',
    };
  } finally {
    await browser?.close();
  }
}

/**
 * CSV file scraper — fetches and parses CSV data.
 */
async function scrapeCsv(url: string): Promise<ScraperResult> {
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'SurplusFundsBot/1.0' },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      return { success: false, funds: [], error: `HTTP ${response.status}` };
    }

    const text = await response.text();
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

    if (lines.length < 2) {
      return { success: false, funds: [], error: 'CSV has no data rows' };
    }

    // Parse header to find relevant columns
    const header = parseCsvLine(lines[0]).map(h => h.toLowerCase());
    const propIdx = header.findIndex(h => h.match(/property|address|parcel|location|description/));
    const amtIdx = header.findIndex(h => h.match(/amount|surplus|excess|proceeds|balance/));
    const nameIdx = header.findIndex(h => h.match(/name|owner|claimant|defendant/));
    const dateIdx = header.findIndex(h => h.match(/date|sale|sold|recorded/));

    const funds: FundEntry[] = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = parseCsvLine(lines[i]);
      const property = cols[propIdx >= 0 ? propIdx : 0] || '';
      if (property) {
        funds.push({
          property,
          amount: amtIdx >= 0 ? cols[amtIdx] : undefined,
          claimant: nameIdx >= 0 ? cols[nameIdx] : undefined,
          date: dateIdx >= 0 ? cols[dateIdx] : undefined,
        });
      }
    }

    return { success: funds.length > 0, funds };
  } catch (error) {
    return { success: false, funds: [], error: error instanceof Error ? error.message : 'CSV fetch failed' };
  }
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * PDF scraper — downloads and tries to extract data.
 */
async function scrapePdf(url: string): Promise<ScraperResult> {
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'SurplusFundsBot/1.0' },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      return { success: false, funds: [], error: `HTTP ${response.status}` };
    }

    const text = await response.text();
    const funds: FundEntry[] = [];

    // If it's actually HTML disguised as PDF link
    if (text.includes('<table') || text.includes('<html')) {
      const rows = text.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi) || [];
      for (const row of rows) {
        const cells = row.match(/<td[^>]*>([\s\S]*?)<\/td>/gi) || [];
        if (cells.length >= 2) {
          const strip = (html: string) => html.replace(/<[^>]+>/g, '').trim();
          const prop = cells[0] ? strip(cells[0]) : '';
          if (prop) {
            funds.push({
              property: prop,
              amount: cells[1] ? strip(cells[1]) : undefined,
              claimant: cells[2] ? strip(cells[2]) : undefined,
            });
          }
        }
      }
    }

    if (funds.length > 0) {
      return { success: true, funds };
    }

    // Actual binary PDF — note for manual review
    return {
      success: true,
      funds: [{ property: `PDF available at ${url} — contains surplus funds list (manual extraction needed)` }],
    };
  } catch (error) {
    return {
      success: false,
      funds: [],
      error: error instanceof Error ? error.message : 'PDF fetch failed',
    };
  }
}
