// Copyright (c) 2026 Vassel Goleyu. All rights reserved.
// Menghasilkan ikon PNG PWA dari public/app/icons/icon.svg memakai Chromium (Playwright). Jalankan: node scripts/make-icons.mjs
import { chromium } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const svg = readFileSync(join(root, 'public/app/icons/icon.svg'), 'utf8');
const browser = await chromium.launch();
const render = async (size, name, pad = 0) => {
  const page = await browser.newPage({ viewport: { width: size, height: size } });
  const inner = Math.round(size * (1 - pad * 2));
  await page.setContent(`<body style="margin:0;background:#08131B;display:grid;place-items:center;width:${size}px;height:${size}px">` +
    `<div style="width:${inner}px;height:${inner}px">${svg.replace('<svg ', `<svg width="${inner}" height="${inner}" `)}</div></body>`);
  writeFileSync(join(root, 'public/app/icons', name), await page.screenshot({ type: 'png', omitBackground: false }));
  await page.close();
};
await render(192, 'icon-192.png');
await render(512, 'icon-512.png');
await render(512, 'icon-maskable-512.png', 0.1); // zona aman maskable
await browser.close();
console.log('ikon dibuat');
