// Copyright (c) 2026 Vassel Goleyu. All rights reserved.
// Mode Supabase diuji dengan klien PALSU (tanpa jaringan, tanpa kredensial). Ini menguji pemetaan dan alur UI, bukan server nyata.
import { expect, test } from '@playwright/test';

const FAKE_CLIENT = `
window.RembukSupabase = { createClient() {
  const data = {
    memberships: [{ role: 'owner', unit_id: 'u1', vendor_id: null }],
    profiles: [{ id: 'me', display_name: 'Alex Uji' }],
    units: [{ id: 'u1', code: 'A-08-03' }],
    projects: [{ id: 'p1', code: 'RMB-X', title: 'Proyek dari server', status: 'Awaiting Feedback', stage: 3, deadline: '2026-12-01', published_scenario: 'B', updated_at: '2026-11-10T00:00:00Z' }],
    project_units: [{ project_id: 'p1', unit_id: 'u1', kind: 'both', access_status: 'Request Sent', slot_date: '2026-12-01', slot_time: '09:00', duration: '2 jam' }],
    cost_lines: [{ project_id: 'p1', description: 'Material', qty: 1, unit_price: 5000000 }],
    scenarios: [{ project_id: 'p1', key: 'B', fund_pct: 40, access_weight: 1, status: 'Published for Feedback', version: 1, policy: 'p' }],
    concerns: [], concern_messages: [], decisions: [], documents: [], work_steps: [], vendors: [],
  };
  return {
    auth: {
      getSession: async () => ({ data: { session: null } }),
      signInWithPassword: async ({ password }) => password === 'benar' ? { data: { user: { id: 'me', email: 'alex@x.test' } }, error: null } : { data: null, error: { message: 'x' } },
      signOut: async () => ({}),
    },
    from: (t) => ({ select: async () => ({ data: data[t] || [], error: null }) }),
    rpc: async () => ({ data: null, error: null }),
  };
} };`;

test('mode Supabase: masuk lewat Auth, data dari server, tombol demo tersembunyi, banner baca-saja', async ({ page }) => {
  await page.route('**/app/config.js', (r) => r.fulfill({ contentType: 'text/javascript', body: 'window.REMBUK_CONFIG={mode:"supabase",supabaseUrl:"https://fake.test",supabaseAnonKey:"anon"};' }));
  await page.route('**/app/js/vendor/rembuk-supabase.js', (r) => r.fulfill({ contentType: 'text/javascript', body: FAKE_CLIENT }));
  await page.route('**/app/sw.js', (r) => r.abort());
  await page.goto('/app/');
  await expect(page.locator('[data-act="demo"]')).toHaveCount(0);
  await page.fill('#em', 'alex@x.test');
  await page.fill('#pw', 'salah');
  await page.click('button[type="submit"]');
  await expect(page.locator('.login')).toContainText('tidak cocok');
  await page.fill('#pw', 'benar');
  await page.click('button[type="submit"]');
  await expect(page.locator('#main')).toContainText('Mode Supabase');
  await page.evaluate(() => { location.hash = '#r-requests'; });
  await expect(page.locator('#main')).toContainText('Proyek dari server');
  await expect(page.locator('#main')).not.toContainText('Common Water Pipe Replacement');
  // tidak ada data yang dipersist ke localStorage pada mode ini
  expect(await page.evaluate(() => localStorage.getItem('rembuk-demo-v2'))).toBeNull();
});
