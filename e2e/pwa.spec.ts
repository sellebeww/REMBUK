// Copyright (c) 2026 Vassel Goleyu. All rights reserved.
import { expect, test } from '@playwright/test';

test('PWA: manifest valid, service worker aktif, aplikasi berjalan offline', async ({ page, context }) => {
  await page.goto('/app/');
  const manifest = await (await page.request.get('/app/manifest.webmanifest')).json();
  expect(manifest.short_name).toBe('REMBUK');
  expect(manifest.display).toBe('standalone');
  for (const i of manifest.icons) expect((await page.request.get('/app/' + i.src)).status()).toBe(200);

  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  // tunggu service worker mengontrol halaman
  await page.reload();
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);

  await context.setOffline(true);
  await page.reload();
  await expect(page.locator('.login')).toBeVisible();
  await page.click('[data-act="demo"][data-r="owner"]');
  await expect(page.locator('#main')).toContainText('Halo');
  await context.setOffline(false);
});
