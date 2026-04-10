/**
 * Sanity e2e suite.
 *
 * beforeAll: creates an isolated 'e2e-sanity' DB, imports e2e/fixtures/sanity.xlsx (5 txns).
 * afterAll:  switches back to the original DB and deletes the test DB.
 *
 * Re-runnable: any leftover 'e2e-sanity' DB from a prior run is deleted before setup.
 *
 * Requires the app to be running: npm run dev
 */

import { test, expect, request as playwrightRequest } from '@playwright/test';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURE = join(__dirname, 'fixtures/sanity.xlsx');
const API = 'http://localhost:3001';
const TEST_DB_NAME = 'e2e-sanity';
const SHEET_NAME = 'SanityAccount';
const EXPECTED_TX = 5;

let originalFilename: string;
let testFilename: string;

test.beforeAll(async () => {
  const ctx = await playwrightRequest.newContext({ baseURL: API });

  // 1. Snapshot active DB
  const dbs = await ctx.get('/api/databases').then(r => r.json()) as { filename: string; name: string; isActive: boolean }[];
  originalFilename = dbs.find(d => d.isActive)!.filename;

  // 2. Delete any leftover test DB from a prior run (re-runnable)
  const stale = dbs.find(d => d.name === TEST_DB_NAME);
  if (stale) {
    await ctx.delete(`/api/databases/${encodeURIComponent(stale.filename)}`);
  }

  // 3. Create fresh test DB
  const created = await ctx.post('/api/databases', { data: { name: TEST_DB_NAME } }).then(r => r.json()) as { filename: string };
  testFilename = created.filename;

  // 4. Switch to test DB
  await ctx.post('/api/databases/switch', { data: { filename: testFilename } });

  // 5. Preview fixture file
  const fileBytes = readFileSync(FIXTURE);
  const preview = await ctx.post('/api/import/preview', {
    multipart: { file: { name: 'sanity.xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', buffer: fileBytes } },
  }).then(r => r.json()) as { fileId: string };

  // 6. Execute import
  const result = await ctx.post('/api/import/execute', {
    data: { fileId: preview.fileId, filename: 'sanity.xlsx' },
  }).then(r => r.json()) as { totalNew: number };

  expect(result.totalNew).toBe(EXPECTED_TX);

  await ctx.dispose();
});

test.afterAll(async () => {
  const ctx = await playwrightRequest.newContext({ baseURL: API });
  await ctx.post('/api/databases/switch', { data: { filename: originalFilename } });
  await ctx.delete(`/api/databases/${encodeURIComponent(testFilename)}`);
  await ctx.dispose();
});

// ── Accounts page ─────────────────────────────────────────────────────────────

test('accounts page shows imported account card', async ({ page }) => {
  await page.goto('/');
  // Scope to the main content area (not the sidebar which also lists accounts)
  await expect(page.getByRole('main').getByText(SHEET_NAME)).toBeVisible();
});

test('accounts page shows correct transaction count on the card', async ({ page }) => {
  await page.goto('/');
  // AccountCard renders <Statistic title="Transactions" value={5} /> — find the card by name, check the count
  await expect(
    page.locator('.ant-card').filter({ hasText: SHEET_NAME }).getByText(String(EXPECTED_TX))
  ).toBeVisible();
});

// ── Transactions page ─────────────────────────────────────────────────────────

test('transactions page loads correct number of rows', async ({ page }) => {
  await page.goto('/transactions');
  // Use .ant-table-row to match only actual data rows (excludes empty/loading rows)
  await expect(page.locator('tr.ant-table-row')).toHaveCount(EXPECTED_TX);
});

test('transactions page search filters results', async ({ page }) => {
  await page.goto('/transactions');
  await page.getByPlaceholder('Search description...').fill('Salary');
  await page.getByPlaceholder('Search description...').press('Enter');
  await expect(page.locator('tr.ant-table-row')).toHaveCount(1);
});

test('transactions page clear search restores full count', async ({ page }) => {
  await page.goto('/transactions');
  await page.getByPlaceholder('Search description...').fill('Salary');
  await page.getByPlaceholder('Search description...').press('Enter');
  await expect(page.locator('tr.ant-table-row')).toHaveCount(1);
  // Clear via the custom allowClear icon
  await page.getByText('Clear').click();
  await expect(page.locator('tr.ant-table-row')).toHaveCount(EXPECTED_TX);
});

// ── Reports page ──────────────────────────────────────────────────────────────

test('reports page renders monthly section with Jan 2024 data', async ({ page }) => {
  await page.goto('/reports');
  // Default view is Monthly — the fixture has transactions in Jan 2024
  await expect(page.getByText('2024-01')).toBeVisible();
});

test('reports page renders by-category section', async ({ page }) => {
  await page.goto('/reports');
  // Switch to Category grouping via the Segmented control
  await page.locator('.ant-segmented-item', { hasText: 'Category' }).click();
  await expect(page.locator('tr.ant-table-row').first()).toBeVisible();
});

// ── Settings — Import page ────────────────────────────────────────────────────

test('settings import page shows account with correct transaction count', async ({ page }) => {
  await page.goto('/settings/import');
  await expect(page.getByText(SHEET_NAME)).toBeVisible();
  // Scope the count check to the table row that contains the account name
  await expect(
    page.locator('tr').filter({ hasText: SHEET_NAME }).getByText(String(EXPECTED_TX))
  ).toBeVisible();
});
