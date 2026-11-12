// Copyright (c) 2026 Vassel Goleyu. All rights reserved.
import { describe, expect, it } from 'vitest';
import { duplicateUnits, isAffected, summarizeParties } from '../src/parties';
import { daysUntil, formatIdDate, isoToDay, parseIdDate, todayIso } from '../src/dates';
import { deadlineLevel, dueItems } from '../src/deadlines';

describe('pihak terdampak', () => {
  const units = [
    { id: 'a', k: 'both' as const }, { id: 'b', k: 'ben' as const }, { id: 'c', k: 'dis' as const }, { id: 'd', k: 'acc' as const }, { id: 'e', k: 'ben' as const },
  ];
  it('menghitung ringkasan sesuai aturan', () => {
    expect(summarizeParties(units)).toEqual({ beneficiaries: 3, access: 2, disturbed: 1, affected: 3, total: 5 });
  });
  it('unit hanya-penerima-manfaat tidak dianggap terdampak', () => {
    expect(isAffected('ben')).toBe(false);
    expect(isAffected('both')).toBe(true);
    expect(isAffected('dis')).toBe(true);
  });
  it('mendeteksi unit ganda', () => {
    expect(duplicateUnits([...units, { id: 'a', k: 'ben' as const }])).toEqual(['a']);
  });
});

describe('tanggal', () => {
  it('memvalidasi ISO termasuk tanggal mustahil', () => {
    expect(Number.isNaN(isoToDay('2026-02-30'))).toBe(true);
    expect(Number.isNaN(isoToDay('26-1-1'))).toBe(true);
    expect(Number.isNaN(isoToDay('2026-11-12'))).toBe(false);
  });
  it('mengurai dan memformat tanggal Indonesia', () => {
    expect(parseIdDate('14 Nov 2026')).toBe('2026-11-14');
    expect(parseIdDate('1 Mei 2027')).toBe('2027-05-01');
    expect(parseIdDate('-')).toBeNull();
    expect(parseIdDate('31 Feb 2026')).toBeNull();
    expect(formatIdDate('2026-08-05')).toBe('05 Agu 2026');
  });
  it('selisih hari lintas bulan dan tahun kabisat', () => {
    expect(daysUntil('2026-11-20', '2026-11-12')).toBe(8);
    expect(daysUntil('2028-03-01', '2028-02-28')).toBe(2);
    expect(daysUntil('2026-11-10', '2026-11-12')).toBe(-2);
  });
  it('todayIso memakai tanggal lokal', () => {
    expect(todayIso(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
  });
});

describe('tenggat', () => {
  const today = '2026-11-12';
  it('tingkat tenggat', () => {
    expect(deadlineLevel('2026-11-10', today)).toBe('overdue');
    expect(deadlineLevel('2026-11-12', today)).toBe('today');
    expect(deadlineLevel('2026-11-14', today)).toBe('soon');
    expect(deadlineLevel('2026-11-20', today)).toBe('upcoming');
    expect(deadlineLevel('2027-01-15', today)).toBe('later');
    expect(deadlineLevel(null, today)).toBe('none');
    expect(deadlineLevel('bukan-tanggal', today)).toBe('none');
  });
  it('mengumpulkan tenggat proyek, akses, dan catatan; mengurutkan; melewati proyek selesai', () => {
    const items = dueItems(
      [
        { id: 'P1', title: 'Pipa', status: 'Awaiting Feedback', deadline: '2026-11-20', units: [{ id: 'U1', access: 'Request Sent', slot: { d: '2026-11-14', t: '09:00' } }, { id: 'U2', access: 'Declined', slot: { d: '2026-11-13', t: '09:00' } }] },
        { id: 'P2', title: 'Plafon', status: 'Completed', deadline: '2026-11-11' },
        { id: 'P3', title: 'Telat', status: 'In Progress', deadline: '2026-11-10' },
      ],
      [{ id: 'n1', title: 'Tinjau', pid: 'P1', deadline: '13 Nov 2026' }, { id: 'n2', title: 'Sudah dibaca', deadline: '13 Nov 2026', read: true }, { id: 'n3', title: 'Tanpa', deadline: '-' }],
      today,
    );
    expect(items.map((i) => i.key)).toEqual(['p:P3', 'n:n1', 'a:P1:U1', 'p:P1']);
    expect(items[0]?.level).toBe('overdue');
  });
  it('mineUnitIds membatasi jadwal akses ke unit sendiri', () => {
    const items = dueItems([{ id: 'P1', title: 'Pipa', status: 'X', units: [{ id: 'U1', access: 'Accepted', slot: { d: '2026-11-14', t: 't' } }, { id: 'U9', access: 'Accepted', slot: { d: '2026-11-14', t: 't' } }] }], [], today, { mineUnitIds: ['U1'], includeProjectDeadlines: false });
    expect(items.map((i) => i.key)).toEqual(['a:P1:U1']);
  });
});
