// Copyright (c) 2026 Vassel Goleyu. All rights reserved.
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const ROLES = [
  { r: 'admin', views: ['overview', 'projects', 'impact', 'cost', 'access', 'resolution', 'decisions', 'exec', 'reports', 'buildings', 'docs', 'notif', 'settings', 'project/RMB-2026-014'] },
  { r: 'owner', views: ['r-overview', 'r-requests', 'r-access', 'r-proposals', 'r-docs', 'notif', 'profile'] },
  { r: 'vendor', views: ['v-overview', 'v-schedule', 'v-work', 'v-docs', 'notif'] },
] as const;

async function login(page: Page, r: string) {
  await page.goto('/app/');
  await page.click(`[data-act="demo"][data-r="${r}"]`);
  await expect(page.locator('#main')).toBeVisible();
}

test.describe('tampilan 360px: tanpa gulir horizontal halaman', () => {
  test.skip(({ viewport }) => (viewport?.width ?? 0) > 400, 'hanya proyek mobile-360');
  for (const { r, views } of ROLES) {
    test(`peran ${r}`, async ({ page }) => {
      await login(page, r);
      const bad: string[] = [];
      for (const v of views) {
        await page.evaluate((x) => { location.hash = '#' + x; }, v);
        await page.waitForTimeout(80);
        const w = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: window.innerWidth }));
        if (w.sw > w.iw) bad.push(`${v}: ${w.sw} > ${w.iw}`);
      }
      expect(bad).toEqual([]);
    });
  }
  test('halaman masuk 360px', async ({ page }) => {
    await page.goto('/app/');
    const w = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: window.innerWidth }));
    expect(w.sw).toBeLessThanOrEqual(w.iw);
  });
});

test.describe('aksesibilitas (axe): tanpa pelanggaran serius atau kritis', () => {
  test('halaman masuk', async ({ page }) => {
    await page.goto('/app/');
    const res = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    const bad = res.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
    expect(bad.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
  });
  for (const { r, views } of ROLES) {
    test(`peran ${r}`, async ({ page }) => {
      await login(page, r);
      const found: string[] = [];
      for (const v of views) {
        await page.evaluate((x) => { location.hash = '#' + x; }, v);
        await page.waitForTimeout(80);
        const res = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
        for (const x of res.violations.filter((i) => i.impact === 'serious' || i.impact === 'critical')) found.push(`${v} | ${x.id}: ${x.nodes.map((n) => n.target.join(" ") + " " + n.html.slice(0, 90)).join(" ; ")}`);
      }
      expect(found).toEqual([]);
    });
  }
});
