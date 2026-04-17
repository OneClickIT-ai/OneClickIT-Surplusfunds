import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('header navigation links are present', async ({ page }) => {
    await page.goto('/');
    const header = page.locator('header');
    await expect(header).toBeVisible();
    await expect(header.getByRole('link', { name: /Directory/i })).toBeVisible();
    await expect(header.getByRole('link', { name: /OSINT/i })).toBeVisible();
    await expect(header.getByRole('link', { name: /Claims/i })).toBeVisible();
    await expect(header.getByRole('link', { name: /Unclaimed/i })).toBeVisible();
    await expect(header.getByRole('link', { name: /Lookup/i })).toBeVisible();
    await expect(header.getByRole('link', { name: /Tools/i })).toBeVisible();
    await expect(header.getByRole('link', { name: /Learn/i })).toBeVisible();
  });

  test('header shows sign in/up for unauthenticated users', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('link', { name: /Sign in/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /Sign up/i }).first()).toBeVisible();
  });

  test('can navigate from home to directory via header', async ({ page }) => {
    await page.goto('/');
    await page.locator('header').getByRole('link', { name: /Directory/i }).click();
    await expect(page).toHaveURL('/directory');
    await expect(page.getByRole('heading', { name: /County Directory/i })).toBeVisible();
  });

  test('can navigate from home to OSINT via header', async ({ page }) => {
    await page.goto('/');
    await page.locator('header').getByRole('link', { name: /OSINT/i }).click();
    await expect(page).toHaveURL('/osint');
    await expect(page.getByRole('heading', { name: /OSINT Tools/i })).toBeVisible();
  });

  test('can navigate from home to claims via header', async ({ page }) => {
    await page.goto('/');
    await page.locator('header').getByRole('link', { name: /Claims/i }).click();
    await expect(page).toHaveURL('/claims');
    await expect(page.getByRole('heading', { name: /Claim Tracker/i })).toBeVisible();
  });

  test('footer links work', async ({ page }) => {
    await page.goto('/');
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
    await expect(footer.getByRole('link', { name: /Directory/i })).toBeVisible();
    await expect(footer.getByRole('link', { name: /Dashboard/i })).toBeVisible();
  });

  test('all public pages return 200', async ({ page }) => {
    const publicPages = [
      '/',
      '/directory',
      '/dashboard',
      '/osint',
      '/claims',
      '/calculator',
      '/unclaimed',
      '/templates',
      '/dorks',
      '/tools',
      '/learn',
      '/lookup',
      '/pricing',
      '/requirements',
      '/partners',
      '/auth/signin',
      '/auth/signup',
    ];

    for (const path of publicPages) {
      const response = await page.goto(path);
      const status = response?.status() ?? 0;
      expect(status, `Expected ${path} to return 200, got ${status}`).toBe(200);
    }
  });
});
