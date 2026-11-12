// Copyright (c) 2026 Vassel Goleyu. All rights reserved.
import { describe, expect, it } from 'vitest';
import { allocate } from '../src/cost';
import { fetchRows, loadRemoteState, respondAccess, rowsToState, verifyServerChain, type RemoteClient } from '../src/remote';
import { isValidState } from '../src/state';

const data: Record<string, Record<string, unknown>[]> = {
  units: [{ id: 'u1', code: 'A-08-03' }, { id: 'u2', code: 'A-08-04' }],
  projects: [{ id: 'p1', code: 'RMB-1', title: 'Pipa', status: 'Awaiting Feedback', stage: 3, deadline: '2026-11-20', published_scenario: 'B', updated_at: '2026-11-10T10:00:00Z' }],
  project_units: [{ project_id: 'p1', unit_id: 'u1', kind: 'both', access_status: 'Request Sent', slot_date: '2026-11-14', slot_time: '09:00', duration: '2 jam' }, { project_id: 'p1', unit_id: 'u2', kind: 'ben', access_status: 'Not Requested' }],
  cost_lines: [{ project_id: 'p1', description: 'Material', qty: '1', unit_price: '7000000', has_quote: true }, { project_id: 'p1', description: 'Kerja', qty: 1, unit_price: 3000000 }],
  scenarios: [{ project_id: 'p1', key: 'B', fund_pct: '40', access_weight: '1', status: 'Published for Feedback', version: 1, policy: 'x' }],
  concerns: [{ id: 'c1', project_id: 'p1', unit_id: 'u1', category: 'Jadwal', description: 'pagi', status: 'New', created_at: '2026-11-10T09:00:00Z' }],
  concern_messages: [{ concern_id: 'c1', author: 'uA', from_staff: true, body: 'dicek', created_at: '2026-11-10T12:00:00Z' }, { concern_id: 'c1', author: 'uB', from_staff: false, body: 'halo', created_at: '2026-11-10T09:00:00Z' }],
  decisions: [{ id: 'd1', project_id: 'p1', unit_id: null, type: 'Otorisasi manajemen', by_user: 'uA', created_at: '2026-11-09T00:00:00Z' }],
  documents: [{ id: 'f1', project_id: 'p1', name: 'Laporan', visibility: 'all', created_at: '2026-11-10T00:00:00Z' }],
  work_steps: [{ project_id: 'p1', step: 0 }],
  profiles: [{ id: 'uA', display_name: 'Sari' }, { id: 'uB', display_name: 'Alex' }],
};
const fake = (over: Partial<Record<string, { error: string }>> = {}, rpcData: unknown = null): RemoteClient & { calls: unknown[] } => {
  const calls: unknown[] = [];
  return {
    calls,
    from: (t: string) => ({ select: async () => (over[t] ? { data: null, error: { message: over[t]!.error } } : { data: data[t] ?? [], error: null }) }),
    rpc: async (fn, args) => { calls.push([fn, args]); return { data: rpcData, error: null }; },
  };
};

describe('adaptor Supabase', () => {
  it('memetakan baris ke bentuk state UI dengan kode, bukan UUID', async () => {
    const st = await loadRemoteState(fake());
    const p = st.projects[0]!;
    expect(p.id).toBe('RMB-1');
    expect(p.units.map((u) => u.id)).toEqual(['A-08-03', 'A-08-04']);
    expect(p.units[0]?.slot).toEqual({ d: '2026-11-14', t: '09:00' });
    expect(p.costs).toHaveLength(2);
    expect(st.concerns[0]?.thread.map((m) => m.text)).toEqual(['halo', 'dicek']); // terurut waktu
    expect(st.concerns[0]?.thread[1]?.role).toBe('staff');
    expect(st.decisions[0]?.unit).toBe('-');
    expect(st.decisions[0]?.by).toBe('Sari');
  });
  it('hasil pemetaan dapat dipakai logika inti (alokasi)', async () => {
    const p = (await loadRemoteState(fake())).projects[0]!;
    const a = allocate(p.costs, p.units as never, p.sc.B as never);
    expect(a.T).toBe(10_000_000);
    expect(a.fund).toBe(4_000_000);
    expect(a.sum).toBe(a.T);
  });
  it('tabel kosong (karena RLS) menghasilkan state kosong, bukan galat', () => {
    const empty = Object.fromEntries(Object.keys(data).map((k) => [k, []])) as never;
    expect(rowsToState(empty).projects).toEqual([]);
  });
  it('galat dari server diteruskan dengan nama tabel', async () => {
    await expect(fetchRows(fake({ projects: { error: 'permission denied' } }))).rejects.toThrow(/projects: permission denied/);
  });
  it('respondAccess memanggil fungsi basis data dan verifikasi rantai menafsirkan hasil', async () => {
    const c = fake();
    await respondAccess(c, 'p1', 'u1', 'Accepted');
    expect(c.calls[0]).toEqual(['respond_access', { p: 'p1', u: 'u1', new_status: 'Accepted' }]);
    expect(await verifyServerChain(fake({}, null), 'b')).toEqual({ ok: true });
    expect(await verifyServerChain(fake({}, 7), 'b')).toEqual({ ok: false, brokenAt: 7 });
  });
  it('isValidState tetap menolak bentuk setengah jadi', () => {
    expect(isValidState({ projects: [] })).toBe(false);
  });
});
