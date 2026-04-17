import { test, expect } from '@playwright/test';

test.describe('Home page', () => {
  test('loads and shows search bar', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Surplus/);
    await expect(page.getByRole('heading', { name: /Find Surplus Funds/i })).toBeVisible();
    await expect(page.getByPlaceholder(/Search counties/i)).toBeVisible();
  });

  test('search navigates to directory', async ({ page }) => {
    await page.goto('/');
    await page.getByPlaceholder(/Search counties/i).fill('Alpine');
    await page.getByPlaceholder(/Search counties/i).press('Enter');
    await expect(page).toHaveURL(/\/directory\?q=Alpine/);
  });

  test('navigation links work', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /Directory/i }).first().click();
    await expect(page).toHaveURL('/directory');
  });

  test('shows 8-step claim process', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /How to Claim Surplus Funds/i })).toBeVisible();
    await expect(page.getByText('STEP 1')).toBeVisible();
    await expect(page.getByText('STEP 8')).toBeVisible();
  });

  test('shows launch banner', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText(/Official Launch/i)).toBeVisible();
  });

  test('shows stats bar', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText(/Counties tracked/i)).toBeVisible();
    await expect(page.getByText(/States covered/i)).toBeVisible();
  });

  test('footer is visible', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('footer')).toBeVisible();
    await expect(page.getByText(/OneClickIT/i).last()).toBeVisible();
  });

  test('legal disclaimer is shown', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText(/Legal disclaimer/i)).toBeVisible();
  });
});
