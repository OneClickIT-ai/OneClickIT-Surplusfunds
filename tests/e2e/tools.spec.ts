import { test, expect } from '@playwright/test';

test.describe('Tools page', () => {
  test('loads with heading and tool cards', async ({ page }) => {
    await page.goto('/tools');
    await expect(page.getByRole('heading', { name: /Surplus Funds Recovery Tools/i })).toBeVisible();
    // Should show tool links
    await expect(page.getByText(/Claim Tracker/i).first()).toBeVisible();
    await expect(page.getByText(/County Directory/i).first()).toBeVisible();
    await expect(page.getByText(/OSINT Tools/i).first()).toBeVisible();
  });

  test('tool cards link to correct pages', async ({ page }) => {
    await page.goto('/tools');
    await page.getByRole('link', { name: /County Directory/i }).first().click();
    await expect(page).toHaveURL('/directory');
  });
});

test.describe('OSINT page', () => {
  test('loads with heading and tool tabs', async ({ page }) => {
    await page.goto('/osint');
    await expect(page.getByRole('heading', { name: /OSINT Tools/i })).toBeVisible();
    // Should show tool type buttons
    await expect(page.getByText(/People/i).first()).toBeVisible();
    await expect(page.getByText(/Username/i).first()).toBeVisible();
  });

  test('has search input', async ({ page }) => {
    await page.goto('/osint');
    const searchInput = page.locator('input').first();
    await expect(searchInput).toBeVisible();
  });
});

test.describe('Calculator page', () => {
  test('loads with heading and form', async ({ page }) => {
    await page.goto('/calculator');
    await expect(page.getByRole('heading', { name: /Claim Amount Calculator/i })).toBeVisible();
    // Form elements
    await expect(page.getByText(/Surplus Amount/i).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /Calculate/i })).toBeVisible();
  });

  test('calculate button works', async ({ page }) => {
    await page.goto('/calculator');
    // Fill in a surplus amount
    const amountInput = page.locator('input[type="number"]').first();
    await amountInput.fill('10000');
    await page.getByRole('button', { name: /Calculate/i }).click();
    // Results should appear
    await expect(page.getByText(/Breakdown/i)).toBeVisible();
  });
});

test.describe('Claims page', () => {
  test('loads with heading', async ({ page }) => {
    await page.goto('/claims');
    await expect(page.getByRole('heading', { name: /Claim Tracker/i })).toBeVisible();
  });

  test('has new claim button', async ({ page }) => {
    await page.goto('/claims');
    await expect(page.getByRole('button', { name: /New Claim/i })).toBeVisible();
  });

  test('shows empty state or loading initially', async ({ page }) => {
    await page.goto('/claims');
    // Should show either loading or empty state
    const hasContent = await page.getByText(/Loading claims|No claims yet/i).first().isVisible({ timeout: 10000 });
    expect(hasContent).toBeTruthy();
  });
});

test.describe('Unclaimed Property page', () => {
  test('loads with heading and state cards', async ({ page }) => {
    await page.goto('/unclaimed');
    await expect(page.getByRole('heading', { name: /Unclaimed Property by State/i })).toBeVisible();
    await expect(page.getByText(/50 state/i).first()).toBeVisible();
  });

  test('search filters states', async ({ page }) => {
    await page.goto('/unclaimed');
    const searchInput = page.locator('input[placeholder*="Search"]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('California');
      await expect(page.getByText(/California/i).first()).toBeVisible();
    }
  });
});

test.describe('Templates page', () => {
  test('loads with heading', async ({ page }) => {
    await page.goto('/templates');
    await expect(page.getByRole('heading', { name: /Claim Letter Templates/i })).toBeVisible();
  });

  test('shows template categories', async ({ page }) => {
    await page.goto('/templates');
    await expect(page.getByText(/Initial Claim/i).first()).toBeVisible();
  });
});

test.describe('Dorks page', () => {
  test('loads with heading and state selector', async ({ page }) => {
    await page.goto('/dorks');
    await expect(page.getByRole('heading', { name: /Google Dork Search Tool/i })).toBeVisible();
    // State selector should be present
    await expect(page.locator('select').first()).toBeVisible();
  });

  test('selecting a state shows dork templates', async ({ page }) => {
    await page.goto('/dorks');
    await page.locator('select').first().selectOption('CA');
    await expect(page.getByText(/Find Excess Proceeds/i).first()).toBeVisible();
  });
});

test.describe('Learn page', () => {
  test('loads with heading', async ({ page }) => {
    await page.goto('/learn');
    await expect(page.getByRole('heading', { name: /Complete Guide/i })).toBeVisible();
  });

  test('has table of contents', async ({ page }) => {
    await page.goto('/learn');
    await expect(page.getByText(/Introduction to Surplus Funds/i).first()).toBeVisible();
  });
});

test.describe('Lookup page', () => {
  test('loads with heading', async ({ page }) => {
    await page.goto('/lookup');
    await expect(page.getByRole('heading', { name: /Third-Party Lookup Tools/i })).toBeVisible();
  });

  test('shows tool categories', async ({ page }) => {
    await page.goto('/lookup');
    await expect(page.getByText(/Person Search/i).first()).toBeVisible();
  });
});

test.describe('Pricing page', () => {
  test('loads with heading and plans', async ({ page }) => {
    await page.goto('/pricing');
    await expect(page.getByRole('heading', { name: /Unlock the Full Platform/i })).toBeVisible();
    await expect(page.getByText(/Monthly/i).first()).toBeVisible();
  });
});

test.describe('Requirements page', () => {
  test('loads with heading', async ({ page }) => {
    await page.goto('/requirements');
    await expect(page.getByRole('heading', { name: /State Claim Requirements/i })).toBeVisible();
  });
});

test.describe('Partners page', () => {
  test('loads with heading', async ({ page }) => {
    await page.goto('/partners');
    await expect(page.getByRole('heading', { name: /Our Partners/i })).toBeVisible();
  });
});
