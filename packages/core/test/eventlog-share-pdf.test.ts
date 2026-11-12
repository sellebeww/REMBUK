// Copyright (c) 2026 Vassel Goleyu. All rights reserved.
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { appendEvent, GENESIS_HASH, verifyChain, type LogEntry, type LogInput } from '../src/eventlog';
import { sha256Hex } from '../src/sha256';
import { whatsappText, whatsappUrl, caseToPdf, DISCLAIMER, type CaseDetail } from '../src/share';
import { buildPdf } from '../src/pdf';
import { can, PERMISSIONS } from '../src/permissions';
import { createI18n, missingKeys } from '../src/i18n';
import { isValidState, parseStoredState } from '../src/state';

describe('sha256', () => {
  it('sama dengan node:crypto untuk berbagai panjang termasuk batas blok dan Unicode', () => {
    for (const s of ['', 'abc', 'a'.repeat(55), 'a'.repeat(56), 'a'.repeat(64), 'a'.repeat(1000), 'Pipa bocor ✓ — unit A-08-03']) {
      expect(sha256Hex(s)).toBe(createHash('sha256').update(s, 'utf8').digest('hex'));
    }
  });
});

const ev = (n: number): LogInput => ({ at: `2026-11-1${n} 10:00`, actor: 'Sari', pid: 'P1', action: `aksi ${n}`, prev: 'a', next: 'b' });

describe('log kejadian append-only (rantai hash)', () => {
  const build = (n: number): LogEntry[] => Array.from({ length: n }, (_, i) => i + 1).reduce<LogEntry[]>((l, i) => appendEvent(l, ev(i)), []);
  it('rantai valid; entri pertama menaut ke genesis', () => {
    const log = build(5);
    expect(log[0]?.prevHash).toBe(GENESIS_HASH);
    expect(verifyChain(log)).toEqual({ ok: true, length: 5 });
    expect(verifyChain([])).toEqual({ ok: true, length: 0 });
  });
  it('appendEvent tidak mengubah masukan', () => {
    const log = build(2);
    const copy = JSON.stringify(log);
    appendEvent(log, ev(3));
    expect(JSON.stringify(log)).toBe(copy);
  });
  it('mendeteksi isi diubah', () => {
    const log = build(4);
    log[1] = { ...(log[1] as LogEntry), actor: 'Orang lain' };
    const r = verifyChain(log);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.brokenAt).toBe(1);
  });
  it('mendeteksi entri dihapus atau urutan ditukar', () => {
    const log = build(4);
    expect(verifyChain([log[0], log[2], log[3]] as LogEntry[]).ok).toBe(false);
    expect(verifyChain([log[1], log[0], log[2], log[3]] as LogEntry[]).ok).toBe(false);
    expect(verifyChain(log.slice(1)).ok).toBe(false);
  });
});

const detail: CaseDetail = {
  id: 'RMB-2026-014', title: 'Penggantian Pipa Air Bersama', building: 'Northpoint Residence', tower: 'Tower A', status: 'Menunggu Umpan Balik', deadline: '2026-11-20',
  total: 18_750_000, fund: 7_500_000, parties: { beneficiaries: 12, access: 4, disturbed: 1 }, scenarioLabel: 'Skenario B', versionLabel: 'v1', openConcerns: 3,
  nextAction: 'Tinjau 1 permintaan jadwal alternatif', isDemo: true, summary: 'Pipa vertikal bocor (data demo).', generatedAt: '12 Nov 2026',
  accessLines: ['A-08-03: Permintaan Terkirim (14 Nov 2026 09:00-12:00)'], costLines: [{ d: 'Material pipa', amt: 7_000_000 }], decisions: [],
};

describe('ekspor', () => {
  it('teks WhatsApp memuat penafian, penanda demo, dan tanpa em dash', () => {
    const t = whatsappText(detail);
    expect(t).toContain('*REMBUK: Penggantian Pipa Air Bersama*');
    expect(t).toContain('Rp 18.750.000');
    expect(t).toContain(DISCLAIMER);
    expect(t).toContain('Data demo fiktif');
    expect(t).not.toContain('—');
    expect(t).not.toMatch(/\n\n\n/);
  });
  it('tautan wa.me berkode URL dan tidak mengirim apa pun', () => {
    const u = whatsappUrl('a b&c');
    expect(u).toBe('https://wa.me/?text=a%20b%26c');
  });
  it('PDF memiliki struktur valid: header, xref cocok dengan offset, trailer', () => {
    const bytes = buildPdf(caseToPdf(detail));
    const s = Buffer.from(bytes).toString('latin1');
    expect(s.startsWith('%PDF-1.4')).toBe(true);
    expect(s.trimEnd().endsWith('%%EOF')).toBe(true);
    const start = Number(/startxref\n(\d+)/.exec(s)?.[1]);
    expect(s.slice(start, start + 4)).toBe('xref');
    const offs = [...s.slice(start).matchAll(/(\d{10}) 00000 n /g)].map((m) => Number(m[1]));
    offs.forEach((o, i) => expect(s.slice(o).startsWith(`${i + 1} 0 obj`)).toBe(true));
    expect(s).toContain('Ringkasan Kasus Perbaikan Bersama');
  });
  it('PDF panjang menghasilkan banyak halaman dan karakter di luar WinAnsi tidak merusak berkas', () => {
    const blocks = Array.from({ length: 120 }, (_, i) => ({ t: 'p' as const, text: `Baris ${i} dengan (kurung) dan \\ garis miring serta ✓ simbol ${'kata '.repeat(30)}` }));
    const s = Buffer.from(buildPdf({ title: 'Uji', blocks })).toString('latin1');
    const pages = Number(/\/Count (\d+)/.exec(s)?.[1]);
    expect(pages).toBeGreaterThan(2);
    expect(s).toContain(`Halaman ${pages} dari ${pages}`);
  });
});

describe('izin per peran', () => {
  it('vendor tidak melihat kekhawatiran, keputusan, atau identitas penghuni', () => {
    for (const a of ['concern.view.all', 'concern.view.own', 'decision.view.all', 'access.view.all', 'access.view.own'] as const) expect(can('vendor', a)).toBe(false);
    expect(can('vendor', 'access.view.schedule')).toBe(true);
    expect(can('vendor', 'work.update')).toBe(true);
  });
  it('warga dan pemilik tidak dapat mengubah proyek, biaya, atau skenario', () => {
    for (const r of ['owner', 'resident'] as const) for (const a of ['project.create', 'project.edit', 'cost.edit', 'scenario.publish', 'decision.record'] as const) expect(can(r, a)).toBe(false);
  });
  it('hanya pemilik yang memberi respons keuangan; penghuni tidak melihat biaya', () => {
    expect(can('owner', 'decision.respond')).toBe(true);
    expect(can('resident', 'decision.respond')).toBe(false);
    expect(can('resident', 'cost.view')).toBe(false);
  });
  it('pengelola memiliki semua izin kecuali tindakan khas warga/vendor', () => {
    expect(PERMISSIONS.manager).toContain('members.manage');
    expect(can('manager', 'concern.raise')).toBe(false);
  });
});

describe('i18n dan state', () => {
  it('terjemahan dengan parameter dan fallback', () => {
    const { t } = createI18n({ id: { hi: 'Halo {name}', only: 'Hanya id' }, en: { hi: 'Hello {name}' } }, 'en');
    expect(t('hi', { name: 'Ana' })).toBe('Hello Ana');
    expect(t('only')).toBe('Hanya id');
    expect(t('none')).toBe('none');
    expect(missingKeys({ id: { a: '1', b: '2' }, en: { a: '1' } })).toEqual({ en: ['b'] });
  });
  it('menolak state rusak', () => {
    expect(parseStoredState('{bukan json')).toBeNull();
    expect(parseStoredState(null)).toBeNull();
    expect(parseStoredState('{"projects":[]}')).toBeNull();
    expect(isValidState({ projects: [{ id: 'x', title: 't', costs: [], units: [], sc: {} }], concerns: [], decisions: [], events: [], notes: [], docs: [], users: [], seq: {} })).toBe(true);
    expect(isValidState({ projects: [], concerns: [], decisions: [], notes: [], docs: [], users: [], seq: {} })).toBe(false);
    expect(isValidState({ projects: [{ id: 1 }], concerns: [], decisions: [], activity: [], notes: [], docs: [], users: [], seq: {} })).toBe(false);
  });
});
