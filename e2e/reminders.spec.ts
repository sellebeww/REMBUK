// Copyright (c) 2026 Vassel Goleyu. All rights reserved.
import { expect, test } from '@playwright/test';

const STUB = () => {
  const w = window as unknown as { __notifs: { title: string; body?: string }[] };
  w.__notifs = [];
  class N {
    static permission = 'granted';
    static requestPermission() { return Promise.resolve('granted'); }
    constructor(title: string, o?: { body?: string }) { w.__notifs.push({ title, body: o?.body }); }
  }
  (window as unknown as { Notification: unknown }).Notification = N;
  // tanpa service worker agar jalur Notification langsung yang diuji
  Object.defineProperty(navigator, 'serviceWorker', { value: undefined, configurable: true });
};

test('pengingat tenggat tampil, bawaan mati, dan notifikasi hanya muncul setelah pengguna mengaktifkan', async ({ page }) => {
  await page.addInitScript(STUB);
  await page.goto('/app/');
  await page.click('[data-act="demo"][data-r="owner"]');
  await expect(page.locator('#main')).toBeVisible();
  await page.evaluate(() => { location.hash = '#notif'; });
  await expect(page.locator('#main')).toContainText('Pengingat tenggat');
  await expect(page.locator('#main')).toContainText('Akses unit A-08-03');
  // belum diaktifkan: tidak ada notifikasi walau izin sudah diberikan
  await page.reload();
  await page.waitForTimeout(600);
  expect(await page.evaluate(() => (window as unknown as { __notifs: unknown[] }).__notifs.length)).toBe(0);
  // pengguna mengaktifkan
  await page.evaluate(() => { location.hash = '#notif'; });
  await page.locator('input[data-bind="S.prefs.remNotif"]').evaluate((el: HTMLInputElement) => el.click());
  await expect.poll(() => page.evaluate(() => (window as unknown as { __notifs: unknown[] }).__notifs.length)).toBe(1);
  const n = await page.evaluate(() => (window as unknown as { __notifs: { title: string; body: string }[] }).__notifs[0]);
  expect(n?.title).toContain('tenggat dekat');
  // sekali sehari: muat ulang tidak menggandakan
  await page.reload();
  await page.waitForTimeout(600);
  expect(await page.evaluate(() => (window as unknown as { __notifs: unknown[] }).__notifs.length)).toBe(0); // stub dibuat ulang per muat; lastRemind mencegah pengulangan
});

test('vendor tidak melihat notifikasi milik pengelola', async ({ page }) => {
  await page.goto('/app/');
  await page.click('[data-act="demo"][data-r="vendor"]');
  await expect(page.locator('#main')).toBeVisible();
  await page.evaluate(() => { location.hash = '#notif'; });
  await expect(page.locator('#main')).toContainText('Jadwal kerja RMB-2026-012 dikonfirmasi');
  await expect(page.locator('#main')).not.toContainText('Unit A-08-04 meminta jadwal alternatif');
  await expect(page.locator('#main')).not.toContainText('Pertanyaan baru tentang alokasi biaya');
});
