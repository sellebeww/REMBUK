// Copyright (c) 2026 Vassel Goleyu. All rights reserved.
import { expect, test } from '@playwright/test';

test('bahasa bawaan id, dapat diganti ke en, dan pilihan diingat', async ({ page }) => {
  await page.goto('/app/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'id');
  await expect(page.locator('.lf h1')).toHaveText('Selamat datang kembali');
  await page.selectOption('#lg', 'en');
  await expect(page.locator('.lf h1')).toHaveText('Welcome back');
  await page.reload();
  await expect(page.locator('.lf h1')).toHaveText('Welcome back');
  await page.click('[data-act="demo"][data-r="admin"]');
  await expect(page.locator('.side')).toContainText('Repair Projects');
});
