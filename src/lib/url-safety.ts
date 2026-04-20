/**
 * SSRF guard for server-side fetches of admin-supplied URLs (e.g. county
 * `listUrl` values the scraper hits). Classic defense-in-depth: even though
 * only admins can set these URLs, a compromised admin account could point
 * the scraper at cloud metadata (169.254.169.254), localhost services, or
 * private RFC1918 ranges and exfiltrate secrets via the response body.
 *
 * This helper validates the *literal* host — no DNS resolution, because
 * (a) DNS is slow, (b) TOCTOU between validation and fetch, and (c) the
 * admin-controlled input is already a small blast radius. Combine with a
 * proxy or outbound egress firewall for hard enforcement.
 */

const PRIVATE_IPV4_PATTERNS: RegExp[] = [
  /^10\./,
  /^127\./,
  /^169\.254\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^0\./,
  /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./,
];

const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  'metadata.google.internal',
  'metadata',
]);

export type UrlSafetyResult =
  | { ok: true; url: URL }
  | { ok: false; reason: string };

export function checkFetchUrl(input: string): UrlSafetyResult {
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    return { ok: false, reason: 'invalid URL' };
  }

  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    return { ok: false, reason: `protocol ${url.protocol} not allowed` };
  }

  // URL normalises `http://[::1]/` → hostname `[::1]` on some Node versions
  // and `::1` on others. Strip brackets for a consistent comparison.
  const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, '');

  if (BLOCKED_HOSTNAMES.has(host) || host.endsWith('.local') || host.endsWith('.internal')) {
    return { ok: false, reason: `host ${host} is blocked` };
  }

  if (host.includes(':')) {
    // IPv6 literal — block loopback + link-local + unique-local.
    if (host === '::1' || host.startsWith('fe80:') || host.startsWith('fc') || host.startsWith('fd')) {
      return { ok: false, reason: 'IPv6 private address blocked' };
    }
  }

  if (/^\d+\.\d+\.\d+\.\d+$/.test(host)) {
    for (const pattern of PRIVATE_IPV4_PATTERNS) {
      if (pattern.test(host)) {
        return { ok: false, reason: `private IPv4 ${host} blocked` };
      }
    }
  }

  return { ok: true, url };
}

export function isSafeFetchUrl(input: string): boolean {
  return checkFetchUrl(input).ok;
}
