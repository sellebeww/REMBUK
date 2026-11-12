// Copyright (c) 2026 Vassel Goleyu. All rights reserved.
// Adaptor Supabase: memetakan baris basis data (sudah difilter RLS di server) ke bentuk state yang dipakai UI.
// Status jujur: dipetakan dan diuji dengan klien palsu; BELUM diuji terhadap instance Supabase nyata.

type Row = Record<string, unknown>;

export interface RemoteRows {
  units: Row[]; projects: Row[]; project_units: Row[]; cost_lines: Row[]; scenarios: Row[];
  concerns: Row[]; concern_messages: Row[]; decisions: Row[]; documents: Row[]; work_steps: Row[]; profiles: Row[];
}

/** Subset klien Supabase yang dipakai; memudahkan klien palsu pada tes. */
export interface RemoteClient {
  from(table: string): { select(cols?: string): PromiseLike<{ data: Row[] | null; error: { message: string } | null }> };
  rpc(fn: string, args?: Record<string, unknown>): PromiseLike<{ data: unknown; error: { message: string } | null }>;
}

export const TABLES = ['units', 'projects', 'project_units', 'cost_lines', 'scenarios', 'concerns', 'concern_messages', 'decisions', 'documents', 'work_steps', 'profiles'] as const;

/** Ambil semua tabel yang boleh dibaca pengguna ini. RLS di server yang menentukan isinya. */
export async function fetchRows(client: RemoteClient): Promise<RemoteRows> {
  const out = {} as RemoteRows;
  const results = await Promise.all(TABLES.map((t) => client.from(t).select('*')));
  results.forEach((r, i) => {
    if (r.error) throw new Error(`Gagal memuat ${TABLES[i]}: ${r.error.message}`);
    (out as unknown as Record<string, Row[]>)[TABLES[i] as string] = r.data ?? [];
  });
  return out;
}

const s = (v: unknown, d = ''): string => (typeof v === 'string' ? v : v == null ? d : String(v));
const n = (v: unknown, d = 0): number => (v == null || v === '' ? d : Number(v));
const isoDate = (v: unknown): string => s(v).slice(0, 10);

const ACCESS_DEFAULTS = { noise: 'Tidak ada', water: 'Tidak ada', dust: 'Tidak ada', sev: 'Rendah', mit: '', contact: 'Belum dihubungi', chk: [0, 0, 0, 0, 0, 0] };

/** Baris basis data ke objek state UI. Kunci UI memakai kode (mis. RMB-2026-014, A-08-03), bukan UUID. */
export function rowsToState(rows: RemoteRows) {
  const unitCode = new Map(rows.units.map((u) => [s(u.id), s(u.code)]));
  const projCode = new Map(rows.projects.map((p) => [s(p.id), s(p.code)]));
  const names = new Map(rows.profiles.map((p) => [s(p.id), s(p.display_name)]));

  const projects = rows.projects.map((p) => {
    const pid = s(p.id);
    const scen = rows.scenarios.filter((x) => s(x.project_id) === pid);
    const sc: Record<string, unknown> = {};
    for (const k of ['A', 'B', 'C']) {
      const r = scen.find((x) => s(x.key) === k);
      sc[k] = { pct: n(r?.fund_pct), saved: n(r?.fund_pct), acc: n(r?.access_weight, 1), status: s(r?.status, 'Draft'), ver: n(r?.version, 1), policy: s(r?.policy), rev: [] };
    }
    const steps = rows.work_steps.filter((w) => s(w.project_id) === pid);
    return {
      id: s(p.code), title: s(p.title), tower: s(p.tower), cat: s(p.category), priority: s(p.priority, 'Normal'), status: s(p.status), stage: n(p.stage),
      deadline: p.deadline ? isoDate(p.deadline) : '', summary: s(p.summary), pub: s(p.published_scenario, 'B'), mgr: '', loc: '', objective: '', outcome: '', assess: 'Verified',
      updated: isoDate(p.updated_at), prev: null,
      costs: rows.cost_lines.filter((c) => s(c.project_id) === pid).map((c) => ({ d: s(c.description), qty: n(c.qty, 1), price: n(c.unit_price), cat: s(c.category), quote: !!c.has_quote })),
      sc,
      units: rows.project_units.filter((u) => s(u.project_id) === pid).map((u) => ({
        id: unitCode.get(s(u.unit_id)) ?? s(u.unit_id), k: s(u.kind), access: s(u.access_status, 'Not Requested'),
        slot: u.slot_date ? { d: isoDate(u.slot_date), t: s(u.slot_time) } : undefined, dur: s(u.duration), ...ACCESS_DEFAULTS,
      })),
      work: { vendor: '', done: steps.length, notes: [], photos: [], extra: [], actual: null, review: false },
    };
  });

  const concerns = rows.concerns.map((c) => ({
    id: s(c.id), pid: projCode.get(s(c.project_id)) ?? '', unit: unitCode.get(s(c.unit_id)) ?? '', cat: s(c.category), item: s(c.item), desc: s(c.description), sugg: '', status: s(c.status), date: isoDate(c.created_at), coord: '',
    thread: rows.concern_messages.filter((m) => s(m.concern_id) === s(c.id)).sort((a, b) => s(a.created_at).localeCompare(s(b.created_at)))
      .map((m) => ({ who: names.get(s(m.author)) ?? 'Pengguna', role: m.from_staff ? 'staff' : 'res', text: s(m.body), t: s(m.created_at) })),
  }));

  const decisions = rows.decisions.map((d) => ({
    id: s(d.id), pid: projCode.get(s(d.project_id)) ?? '', type: s(d.type), unit: d.unit_id ? unitCode.get(s(d.unit_id)) ?? '' : '-', by: names.get(s(d.by_user)) ?? 'Pengguna',
    ver: s(d.version), date: isoDate(d.created_at), status: 'Tercatat', basis: s(d.basis), note: s(d.note),
  }));

  const docs = rows.documents.map((d) => ({ id: s(d.id), pid: projCode.get(s(d.project_id)) ?? '', name: s(d.name), cat: s(d.category), vis: s(d.visibility), size: '', by: '', date: isoDate(d.created_at) }));

  return { projects, concerns, decisions, docs };
}

export async function loadRemoteState(client: RemoteClient) {
  return rowsToState(await fetchRows(client));
}

/** Tindakan tulis yang aman: semuanya melewati RLS atau fungsi basis data. Pemanggil menangani galat. */
export async function respondAccess(client: RemoteClient, projectId: string, unitId: string, status: 'Accepted' | 'Alternative Requested' | 'Declined' | 'Info Requested') {
  const r = await client.rpc('respond_access', { p: projectId, u: unitId, new_status: status });
  if (r.error) throw new Error(r.error.message);
}

export async function verifyServerChain(client: RemoteClient, buildingId: string): Promise<{ ok: true } | { ok: false; brokenAt: number }> {
  const r = await client.rpc('verify_event_chain', { b: buildingId });
  if (r.error) throw new Error(r.error.message);
  return r.data == null ? { ok: true } : { ok: false, brokenAt: Number(r.data) };
}
