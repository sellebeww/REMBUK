// Copyright (c) 2026 Vassel Goleyu. All rights reserved.
import type { Allocation, CostLine, Scenario, UnitRef } from './types';

const finiteNonNeg = (n: unknown): number => (typeof n === 'number' && Number.isFinite(n) && n > 0 ? n : 0);

/** Biaya satu baris dalam Rupiah bulat. Nilai negatif, NaN, atau tak hingga dianggap 0. */
export function lineTotal(line: Pick<CostLine, 'qty' | 'price'>): number {
  return Math.round(finiteNonNeg(line.qty) * finiteNonNeg(line.price));
}

/** Total biaya proyek dalam Rupiah bulat (jumlah baris yang sudah dibulatkan satu per satu). */
export function totalCost(lines: readonly Pick<CostLine, 'qty' | 'price'>[]): number {
  return lines.reduce((sum, l) => sum + lineTotal(l), 0);
}

/** Batasi persentase ke 0..100; nilai tak valid menjadi 0. */
export function clampPct(pct: unknown): number {
  const n = typeof pct === 'number' && Number.isFinite(pct) ? pct : 0;
  return Math.min(100, Math.max(0, n));
}

/**
 * Bagi jumlah `amount` menurut bobot dengan metode sisa terbesar, dalam kelipatan `step`.
 * Jumlah hasil selalu sama persis dengan `amount` bila amount kelipatan step.
 */
export function distribute(amount: number, weights: readonly number[], step: number): number[] {
  const sw = weights.reduce((a, b) => a + b, 0);
  if (!weights.length || sw <= 0 || amount <= 0) return weights.map(() => 0);
  const raw = weights.map((w) => (amount * w) / sw);
  const base = raw.map((r) => Math.floor(r / step) * step);
  let rem = Math.round((amount - base.reduce((a, b) => a + b, 0)) / step);
  // Urutkan sisa terbesar; indeks dipakai sebagai pemutus seri agar hasil deterministik.
  const order = raw.map((r, i) => [r - (base[i] ?? 0), i] as const).sort((a, b) => b[0] - a[0] || a[1] - b[1]);
  for (const [, i] of order) {
    if (rem <= 0) break;
    base[i] = (base[i] ?? 0) + step;
    rem -= 1;
  }
  return base;
}

/**
 * Usulan pembagian biaya (bukan kewajiban). Aturan:
 * - Total = jumlah baris biaya, Rupiah bulat.
 * - Dana bersama = persentase skenario dari total, dibulatkan ke kelipatan 1.000 bila total kelipatan 1.000, jika tidak ke 1 Rupiah.
 * - Sisanya dibagi ke unit penerima manfaat (ben dan both); unit "both" berbobot `acc`, unit "ben" berbobot 1.
 * - Tanpa unit penerima manfaat, sisa dicatat sebagai "unassigned".
 */
export function allocate(lines: readonly CostLine[], units: readonly UnitRef[], sc: Scenario): Allocation {
  const warnings: string[] = [];
  const T = totalCost(lines);
  const step = T % 1000 === 0 ? 1000 : 1;
  const pct = clampPct(sc.pct);
  if (pct !== sc.pct) warnings.push('Persentase dana bersama di luar 0 sampai 100 dan telah dibatasi.');
  const fund = Math.min(T, Math.round((T * pct) / 100 / step) * step);
  const owner = T - fund;
  const ben = units.filter((u) => u.k === 'ben' || u.k === 'both');
  const accW = finiteNonNeg(sc.acc);
  const w = ben.map((u) => (u.k === 'both' ? accW : 1));
  if (!ben.length || w.every((x) => x === 0)) {
    if (owner > 0) warnings.push('Tidak ada unit penerima manfaat; sisa biaya belum dapat dibagi.');
    return { T, fund, owner, rows: ben.map((u, i) => ({ id: u.id, amt: 0, w: w[i] ?? 0, acc: u.k === 'both' })), unassigned: owner, sum: fund, warnings };
  }
  const amts = distribute(owner, w, step);
  const rows = ben.map((u, i) => ({ id: u.id, amt: amts[i] ?? 0, w: w[i] ?? 0, acc: u.k === 'both' }));
  const sum = fund + amts.reduce((a, b) => a + b, 0);
  if (sum !== T) warnings.push('Jumlah porsi berbeda dari total karena pembulatan.');
  return { T, fund, owner, rows, unassigned: 0, sum, warnings };
}
