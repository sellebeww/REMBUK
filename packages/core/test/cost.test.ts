// Copyright (c) 2026 Vassel Goleyu. All rights reserved.
import { describe, expect, it } from 'vitest';
import { allocate, clampPct, distribute, lineTotal, totalCost } from '../src/cost';
import type { CostLine, UnitRef } from '../src/types';

const lines = (...p: number[]): CostLine[] => p.map((price, i) => ({ d: `l${i}`, qty: 1, price }));
const bens = (n: number): UnitRef[] => Array.from({ length: n }, (_, i) => ({ id: `U${i + 1}`, k: 'ben' as const }));

describe('totalCost', () => {
  it('menjumlah qty x harga dan membulatkan per baris', () => {
    expect(totalCost([{ qty: 2, price: 1500000 }, { qty: 1, price: 0.4 }])).toBe(3000000);
    expect(lineTotal({ qty: 3, price: 33.5 })).toBe(101); // 100.5 dibulatkan
  });
  it('mengabaikan nilai negatif, NaN, dan tak hingga', () => {
    expect(lineTotal({ qty: -2, price: 100 })).toBe(0);
    expect(lineTotal({ qty: NaN, price: 100 })).toBe(0);
    expect(lineTotal({ qty: 1, price: Infinity })).toBe(0);
    expect(totalCost([])).toBe(0);
  });
});

describe('clampPct', () => {
  it('membatasi ke 0..100', () => {
    expect(clampPct(-5)).toBe(0);
    expect(clampPct(130)).toBe(100);
    expect(clampPct(NaN)).toBe(0);
    expect(clampPct(42.5)).toBe(42.5);
  });
});

describe('distribute', () => {
  it('jumlah hasil sama dengan masukan (sisa terbesar)', () => {
    const r = distribute(10_000, [1, 1, 1], 1000);
    expect(r.reduce((a, b) => a + b, 0)).toBe(10_000);
    expect(r).toEqual([4000, 3000, 3000]); // seri: indeks kecil lebih dulu
  });
  it('bobot nol atau kosong menghasilkan 0', () => {
    expect(distribute(1000, [], 1)).toEqual([]);
    expect(distribute(1000, [0, 0], 1)).toEqual([0, 0]);
  });
});

describe('allocate', () => {
  it('kasus RMB-2026-014 skenario B (40% dana): total, dana, dan porsi', () => {
    const costs: CostLine[] = [1250000, 5500000, 7000000, 1250000, 2500000, 1250000].map((price, i) => ({ d: `x${i}`, qty: 1, price }));
    const units: UnitRef[] = [{ id: 'A-08-03', k: 'both' }, { id: 'A-08-04', k: 'both' }, { id: 'A-08-05', k: 'both' }, ...bens(9)];
    const a = allocate(costs, units, { pct: 40, acc: 1 });
    expect(a.T).toBe(18_750_000);
    expect(a.fund).toBe(7_500_000);
    expect(a.owner).toBe(11_250_000);
    expect(a.sum).toBe(a.T);
    expect(a.rows).toHaveLength(12);
    expect(a.rows.every((r) => r.amt % 1000 === 0)).toBe(true);
    expect(a.warnings).toEqual([]);
  });

  it('bobot akses 0,5 membuat penyedia akses menanggung separuh', () => {
    const units: UnitRef[] = [{ id: 'P', k: 'both' }, { id: 'Q', k: 'ben' }];
    const a = allocate(lines(3_000_000), units, { pct: 0, acc: 0.5 });
    expect(a.rows.find((r) => r.id === 'P')?.amt).toBe(1000_000);
    expect(a.rows.find((r) => r.id === 'Q')?.amt).toBe(2000_000);
    expect(a.sum).toBe(3_000_000);
  });

  it('tanpa unit penerima manfaat sisa menjadi unassigned dengan peringatan', () => {
    const a = allocate(lines(1_000_000), [{ id: 'D', k: 'dis' }], { pct: 25, acc: 1 });
    expect(a.fund).toBe(250_000 - (250_000 % 1000));
    expect(a.unassigned).toBe(a.owner);
    expect(a.warnings.length).toBe(1);
  });

  it('persentase di luar batas dibatasi, porsi tidak pernah negatif', () => {
    const neg = allocate(lines(5_000_000), bens(3), { pct: -50, acc: 1 });
    expect(neg.fund).toBe(0);
    expect(neg.rows.every((r) => r.amt >= 0)).toBe(true);
    expect(neg.warnings.length).toBe(1);
    const over = allocate(lines(5_000_000), bens(3), { pct: 250, acc: 1 });
    expect(over.fund).toBe(5_000_000);
    expect(over.owner).toBe(0);
    expect(over.sum).toBe(5_000_000);
  });

  it('total bukan kelipatan 1000: pembulatan ke 1 Rupiah, jumlah tetap tepat', () => {
    const a = allocate(lines(1_000_001), bens(3), { pct: 33, acc: 1 });
    expect(a.T).toBe(1_000_001);
    expect(a.sum).toBe(1_000_001);
  });

  it('properti: jumlah porsi selalu sama dengan total untuk banyak kombinasi', () => {
    let seed = 7;
    const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
    for (let i = 0; i < 300; i++) {
      const n = 1 + Math.floor(rnd() * 20);
      const total = Math.floor(rnd() * 500) * 100_000 + (rnd() < 0.3 ? Math.floor(rnd() * 999) : 0);
      const units: UnitRef[] = Array.from({ length: n }, (_, j) => ({ id: `U${j}`, k: rnd() < 0.3 ? 'both' : 'ben' }));
      const a = allocate([{ d: 'x', qty: 1, price: total }], units, { pct: Math.floor(rnd() * 101), acc: rnd() < 0.5 ? 1 : 0.5 });
      expect(a.sum).toBe(a.T);
      expect(a.rows.every((r) => r.amt >= 0)).toBe(true);
      expect(a.fund + a.owner).toBe(a.T);
    }
  });
});
