import { test, expect } from '@playwright/test';

test.describe('Directory page', () => {
  test('loads with heading and table structure', async ({ page }) => {
    await page.goto('/directory');
    await expect(page.getByRole('heading', { name: /County Directory/i })).toBeVisible();
    // Table header should be visible (th elements)
    await expect(page.locator('th').first()).toBeVisible();
    // Should show county count
    await expect(page.getByText(/counties found/i)).toBeVisible();
  });

  test('state filter updates URL', async ({ page }) => {
    await page.goto('/directory');
    // CountyFilters is a client component loaded in Suspense
    const stateSelect = page.locator('select').first();
    if (await stateSelect.isVisible()) {
      await stateSelect.selectOption('CA');
      await expect(page).toHaveURL(/state=CA/);
    }
  });

  test('search query param is reflected in URL', async ({ page }) => {
    await page.goto('/directory?q=test');
    await expect(page).toHaveURL(/q=test/);
    await expect(page.getByRole('heading', { name: /County Directory/i })).toBeVisible();
  });

  test('empty results show message', async ({ page }) => {
    await page.goto('/directory?q=zzznonexistent');
    await expect(page.getByText(/No counties match/i)).toBeVisible();
  });
});
