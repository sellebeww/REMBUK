// Copyright (c) 2026 Vassel Goleyu. All rights reserved.
import { expect, test, type Page } from '@playwright/test';

const ROLES = [
  { r: 'admin', views: ['overview', 'projects', 'impact', 'cost', 'access', 'resolution', 'decisions', 'exec', 'reports', 'buildings', 'docs', 'notif', 'settings'] },
  { r: 'coord', views: ['overview', 'projects', 'impact', 'access', 'resolution', 'exec', 'docs', 'notif'] },
  { r: 'owner', views: ['r-overview', 'r-requests', 'r-access', 'r-proposals', 'r-docs', 'notif', 'profile'] },
] as const;

function watch(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/fonts\.g|ERR_|Failed to load resource/.test(m.text())) errors.push('console: ' + m.text()); });
  return errors;
}

for (const { r, views } of ROLES) {
  test(`sapuan semua halaman: peran ${r}`, async ({ page }) => {
    const errors = watch(page);
    await page.goto('/app/');
    await page.click(`[data-act="demo"][data-r="${r}"]`);
    await expect(page.locator('#main')).toBeVisible();
    for (const v of views) {
      await page.evaluate((view) => { location.hash = '#' + view; }, v);
      await page.waitForTimeout(60);
      const html = await page.locator('#main').innerHTML();
      expect(html.length, `halaman ${v} kosong`).toBeGreaterThan(200);
      expect(html, `halaman ${v} memuat undefined/NaN`).not.toMatch(/>\s*(undefined|NaN|null)\s*<|Rp NaN|\$\{/);
    }
    expect(errors).toEqual([]);
  });
}
