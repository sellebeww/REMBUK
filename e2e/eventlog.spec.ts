// Copyright (c) 2026 Vassel Goleyu. All rights reserved.
import { expect, test } from '@playwright/test';

test('log kejadian berantai: utuh, bertambah saat ada aksi, dan perubahan diam-diam terdeteksi', async ({ page }) => {
  await page.goto('/app/');
  await page.click('[data-act="demo"][data-r="admin"]');
  await expect(page.locator('#main')).toBeVisible();
  await page.evaluate(() => { location.hash = '#project/RMB-2026-014/act'; });
  await expect(page.locator('#main')).toContainText('Rantai log utuh');
  const before = await page.evaluate(() => JSON.parse(localStorage.getItem('rembuk-demo-v2') as string).events.length as number);

  // aksi nyata (jeda proyek) menambah satu entri
  await page.evaluate(() => { location.hash = '#project/RMB-2026-014'; });
  await page.click('[data-act="menu"][data-m="manage"]');
  await page.click('[data-act="pauseP"]');
  const after = await page.evaluate(() => JSON.parse(localStorage.getItem('rembuk-demo-v2') as string).events.length as number);
  expect(after).toBeGreaterThan(before);

  // ubah satu entri langsung di penyimpanan, lalu muat ulang
  await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem('rembuk-demo-v2') as string);
    s.events[1].actor = 'Orang Lain';
    localStorage.setItem('rembuk-demo-v2', JSON.stringify(s));
  });
  await page.reload();
  await page.evaluate(() => { location.hash = '#project/RMB-2026-014/act'; });
  await expect(page.locator('#main')).toContainText('Rantai log tidak cocok pada entri #2');
});
