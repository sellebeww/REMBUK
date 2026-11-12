// Copyright (c) 2026 Vassel Goleyu. All rights reserved.
import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';

test('ekspor ringkasan kasus: PDF nyata dan teks WhatsApp yang tidak dikirim otomatis', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/app/');
  await page.click('[data-act="demo"][data-r="admin"]');
  await expect(page.locator('#main')).toBeVisible();
  await page.evaluate(() => { location.hash = '#project/RMB-2026-014/dec'; });
  await page.click('[data-act="prevAgree"]');

  const [dl] = await Promise.all([page.waitForEvent('download'), page.click('.modal [data-act="pdf"]')]);
  expect(dl.suggestedFilename()).toBe('ringkasan-RMB-2026-014.pdf');
  const path = await dl.path();
  const head = readFileSync(path).subarray(0, 8).toString('latin1');
  expect(head.startsWith('%PDF-1.4')).toBe(true);
  expect(readFileSync(path).toString('latin1')).toContain('Ringkasan Kasus Perbaikan Bersama');

  // WhatsApp: hanya menyiapkan teks; membuka WhatsApp butuh klik pengguna
  await page.click('.modal [data-act="waShare"]');
  const ta = page.locator('#wat');
  await expect(ta).toContainText('REMBUK: Common Water Pipe Replacement');
  await expect(ta).toContainText('Bukan keputusan final');
  await expect(ta).toContainText('Data demo fiktif');
  await page.click('.modal [data-act="waCopy"]');
  const clip = await page.evaluate(() => navigator.clipboard.readText());
  expect(clip).toContain('Rp 18.750.000');
  const popups: string[] = [];
  context.on('page', (p) => popups.push(p.url()));
  expect(popups).toEqual([]); // belum ada yang dibuka sebelum pengguna menekan tombol
});
