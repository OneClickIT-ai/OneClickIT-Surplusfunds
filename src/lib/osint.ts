import { getServerSession } from '@/lib/auth';
import { authOptions } from './auth';
import { err } from './api-utils';
import { rateLimit } from './rate-limit';

/**
 * Middleware to check if user has Pro access for OSINT tools.
 * Returns null if authorized, or an error Response if not.
 */
export async function requirePro() {
  const session = await getServerSession(authOptions);
  if (!session) return err('Unauthorized', 401);
  if (session.user.role !== 'pro' && session.user.role !== 'admin') {
    return err('Pro subscription required for OSINT tools', 403);
  }
  // Rate limit: 30 OSINT requests per minute per user
  if (!rateLimit(`osint:${session.user.id}`, 30, 60_000).success) {
    return err('Too many requests. Please try again later.', 429);
  }
  return null;
}

// --- People Search (Abstract API + fallback) ---
export async function searchPeople(name: string) {
  // Primary: Abstract API People Enrichment (free tier: 100 req/month)
  // Fallback: basic name parsing
  const apiKey = process.env.ABSTRACT_API_KEY;
  if (apiKey) {
    try {
      const res = await fetch(
        `https://emailvalidation.abstractapi.com/v1/?api_key=${apiKey}&email=${encodeURIComponent(name)}`,
        { signal: AbortSignal.timeout(10000) }
      );
      if (res.ok) {
        const data = await res.json();
        return { results: [data], source: 'Abstract API' };
      }
    } catch { /* fallback */ }
  }

  // Fallback: parse name and return structured data
  const parts = name.trim().split(/\s+/);
  return {
    results: [{
      first_name: parts[0] || '',
      last_name: parts.slice(1).join(' ') || '',
      full_name: name.trim(),
      note: 'Basic parse only. Connect an API key for enriched results.',
    }],
    source: 'Local parse',
  };
}

// --- Address Lookup (Geocodio - 2,500 free/day) ---
export async function lookupAddress(address: string) {
  const geocodioKey = process.env.GEOCODIO_API_KEY;

  // Primary: Geocodio (2,500 free lookups/day, US + Canada)
  if (geocodioKey) {
    try {
      const res = await fetch(
        `https://api.geocod.io/v1.7/geocode?q=${encodeURIComponent(address)}&api_key=${geocodioKey}&fields=census,acs-economics`,
        { signal: AbortSignal.timeout(10000) }
      );
      if (res.ok) {
        const data = await res.json();
        const results = (data.results || []).map((r: Record<string, unknown>) => ({
          formatted_address: r.formatted_address,
          accuracy: r.accuracy,
          accuracy_type: r.accuracy_type,
          location: r.location,
          address_components: r.address_components,
          county: (r.address_components as Record<string, unknown>)?.county,
          state: (r.address_components as Record<string, unknown>)?.state,
          census: (r.fields as Record<string, unknown>)?.census,
        }));
        return { results, source: 'Geocodio' };
      }
    } catch { /* fallback */ }
  }

  // Fallback: US Census Geocoder (free, no key)
  try {
    const res = await fetch(
      `https://geocoding.geo.census.gov/geocoder/locations/onelineaddress?address=${encodeURIComponent(address)}&benchmark=Public_AR_Current&format=json`,
      { signal: AbortSignal.timeout(10000) }
    );
    if (res.ok) {
      const data = await res.json();
      const matches = data.result?.addressMatches || [];
      return {
        results: matches.map((m: Record<string, unknown>) => ({
          matched_address: m.matchedAddress,
          coordinates: m.coordinates,
          address_components: m.addressComponents,
        })),
        source: 'US Census Geocoder',
      };
    }
  } catch { /* offline */ }

  return { results: [], source: 'Address lookup unavailable' };
}

// --- Phone Lookup (NumVerify - free tier: 100 req/month) ---
export async function lookupPhone(phone: string) {
  const apiKey = process.env.NUMVERIFY_API_KEY;
  const cleaned = phone.replace(/\D/g, '');

  if (apiKey) {
    try {
      const res = await fetch(
        `http://apilayer.net/api/validate?access_key=${apiKey}&number=${cleaned}&country_code=US&format=1`,
        { signal: AbortSignal.timeout(10000) }
      );
      if (res.ok) {
        const data = await res.json();
        return {
          results: [{
            number: data.number,
            valid: data.valid,
            local_format: data.local_format,
            international_format: data.international_format,
            carrier: data.carrier,
            line_type: data.line_type,
            location: data.location,
          }],
          source: 'NumVerify',
        };
      }
    } catch { /* fallback */ }
  }

  return {
    results: [{
      number: cleaned,
      formatted: cleaned.length === 10 ? `(${cleaned.slice(0,3)}) ${cleaned.slice(3,6)}-${cleaned.slice(6)}` : cleaned,
      note: 'Connect NumVerify API key for carrier/validation data.',
    }],
    source: 'Local format',
  };
}

// --- Email Verification (Abstract API - free tier: 100 req/month) ---
export async function verifyEmail(email: string) {
  const apiKey = process.env.ABSTRACT_API_KEY;

  if (apiKey) {
    try {
      const res = await fetch(
        `https://emailvalidation.abstractapi.com/v1/?api_key=${apiKey}&email=${encodeURIComponent(email)}`,
        { signal: AbortSignal.timeout(10000) }
      );
      if (res.ok) {
        const data = await res.json();
        return {
          results: [{
            email: data.email,
            deliverability: data.deliverability,
            is_valid: data.is_valid_format?.value,
            is_disposable: data.is_disposable_email?.value,
            is_free_provider: data.is_free_email?.value,
            quality_score: data.quality_score,
          }],
          source: 'Abstract API',
        };
      }
    } catch { /* fallback */ }
  }

  // Basic validation fallback
  const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const domain = email.split('@')[1] || '';
  const freeProviders = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com'];

  return {
    results: [{
      email,
      format_valid: isValid,
      domain,
      is_free_provider: freeProviders.includes(domain.toLowerCase()),
      note: 'Basic format check only. Connect API key for deliverability data.',
    }],
    source: 'Local validation',
  };
}
