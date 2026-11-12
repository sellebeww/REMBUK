// Copyright (c) 2026 Vassel Goleyu. All rights reserved.
import { expect, test, type Page } from '@playwright/test';

async function login(page: Page, r: string) {
  await page.goto('/app/');
  await page.click(`[data-act="demo"][data-r="${r}"]`);
  await expect(page.locator('#main')).toBeVisible();
}
const go = async (page: Page, v: string) => { await page.evaluate((x) => { location.hash = '#' + x; }, v); await page.waitForTimeout(80); };

test('vendor hanya melihat proyek ditugaskan, tanpa data penghuni atau biaya', async ({ page }) => {
  await login(page, 'vendor');
  await expect(page.locator('#main')).toContainText('RMB-2026-012');
  await expect(page.locator('#main')).not.toContainText('RMB-2026-014');
  await go(page, 'v-schedule');
  await expect(page.locator('#main')).toContainText('A-04-01');
  const text = await page.locator('#main').innerText();
  expect(text).not.toMatch(/Alex|Maya|Rp \d/);
  // halaman manajemen tidak dapat dibuka lewat URL
  for (const v of ['cost', 'resolution', 'decisions', 'settings']) {
    await go(page, v);
    await expect(page.locator('#main')).toContainText('Proyek Saya');
  }
});

test('vendor mencentang langkahnya sendiri, tetapi tidak langkah milik pengelola', async ({ page }) => {
  await login(page, 'vendor');
  await go(page, 'v-work');
  // RMB-2026-012 selesai 2 langkah; langkah ke-3 milik pengelola
  await expect(page.locator('#main')).toContainText('Langkah berikutnya dilakukan pengelola');
  await expect(page.locator('[data-act="vStep"]')).toHaveCount(0);
});

test('penghuni tidak melihat nominal kontribusi dan tidak dapat menyetujui usulan keuangan', async ({ page }) => {
  await login(page, 'resident');
  await go(page, 'r-proposals');
  const main = page.locator('#main');
  await expect(main).toContainText('dibahas dengan pemilik unit');
  expect(await main.innerText()).not.toMatch(/Rp \d/);
  await expect(main).not.toContainText('Saya setuju dengan usulan');
});

test('pemilik melihat usulan kontribusi unitnya dan tulisan bukan kewajiban', async ({ page }) => {
  await login(page, 'owner');
  await go(page, 'r-proposals');
  await expect(page.locator('#main')).toContainText('bukan kewajiban');
  await expect(page.locator('#main')).toContainText('Rp');
});

test('pengelola dapat berpindah peran lewat menu akun; MY mengikuti peran', async ({ page }) => {
  await login(page, 'owner');
  await page.click('[data-act="menu"][data-m="user"]');
  await page.click('[data-act="switchRole"][data-r="resident"]');
  await go(page, 'profile');
  await expect(page.locator('#main')).toContainText('A-08-04');
  await expect(page.locator('#main')).toContainText('Penghuni');
});
