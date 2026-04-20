import { describe, it, expect } from 'vitest';

import { checkFetchUrl, isSafeFetchUrl } from '@/lib/url-safety';

describe('url-safety', () => {
  it('accepts well-formed public HTTPS URLs', () => {
    expect(isSafeFetchUrl('https://example.com/path')).toBe(true);
    expect(isSafeFetchUrl('https://county.gov/surplus.csv')).toBe(true);
  });

  it('accepts plain HTTP for legacy county sites', () => {
    expect(isSafeFetchUrl('http://county.gov/list')).toBe(true);
  });

  it('rejects non-HTTP schemes', () => {
    const result = checkFetchUrl('file:///etc/passwd');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/protocol/);
    expect(isSafeFetchUrl('gopher://evil.example/')).toBe(false);
    expect(isSafeFetchUrl('data:text/plain,hi')).toBe(false);
  });

  it('rejects malformed URLs', () => {
    expect(isSafeFetchUrl('not-a-url')).toBe(false);
    expect(isSafeFetchUrl('')).toBe(false);
  });

  it('blocks localhost and loopback', () => {
    expect(isSafeFetchUrl('http://localhost/')).toBe(false);
    expect(isSafeFetchUrl('http://127.0.0.1/')).toBe(false);
    expect(isSafeFetchUrl('http://[::1]/')).toBe(false);
  });

  it('blocks AWS and GCP metadata endpoints', () => {
    expect(isSafeFetchUrl('http://169.254.169.254/latest/meta-data/')).toBe(false);
    expect(isSafeFetchUrl('http://metadata.google.internal/')).toBe(false);
  });

  it('blocks RFC1918 private ranges', () => {
    expect(isSafeFetchUrl('http://10.0.0.5/')).toBe(false);
    expect(isSafeFetchUrl('http://172.16.0.1/')).toBe(false);
    expect(isSafeFetchUrl('http://172.31.255.254/')).toBe(false);
    expect(isSafeFetchUrl('http://192.168.1.1/')).toBe(false);
  });

  it('allows 172.15.x.x and 172.32.x.x (outside the /12)', () => {
    expect(isSafeFetchUrl('http://172.15.0.1/')).toBe(true);
    expect(isSafeFetchUrl('http://172.32.0.1/')).toBe(true);
  });

  it('blocks .local and .internal hostnames', () => {
    expect(isSafeFetchUrl('http://mac-mini.local/')).toBe(false);
    expect(isSafeFetchUrl('http://svc.cluster.internal/')).toBe(false);
  });
});
