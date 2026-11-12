// Copyright (c) 2026 Vassel Goleyu. All rights reserved.

const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const MS_DAY = 86_400_000;

/** ISO "YYYY-MM-DD" ke penanda hari UTC (ms). Mengembalikan NaN bila tidak valid. */
export function isoToDay(iso: string): number {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return NaN;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const t = Date.UTC(y, mo - 1, d);
  const back = new Date(t);
  return back.getUTCFullYear() === y && back.getUTCMonth() === mo - 1 && back.getUTCDate() === d ? t : NaN;
}

/** "14 Nov 2026" (format tampilan Indonesia) ke ISO; null bila tidak dapat dibaca. */
export function parseIdDate(s: string): string | null {
  const m = /^(\d{1,2})\s+([A-Za-z]{3})[a-z]*\.?\s+(\d{4})/.exec(s.trim());
  if (!m) return null;
  const idx = MON.findIndex((x) => x.toLowerCase() === (m[2] ?? '').toLowerCase());
  if (idx < 0) return null;
  const iso = `${m[3]}-${String(idx + 1).padStart(2, '0')}-${String(Number(m[1])).padStart(2, '0')}`;
  return Number.isNaN(isoToDay(iso)) ? null : iso;
}

export const formatIdDate = (iso: string): string => {
  const t = isoToDay(iso);
  if (Number.isNaN(t)) return '-';
  const d = new Date(t);
  return `${String(d.getUTCDate()).padStart(2, '0')} ${MON[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
};

export function todayIso(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Selisih hari kalender (target - hari ini). Negatif berarti sudah lewat. NaN bila tanggal tidak valid. */
export function daysUntil(targetIso: string, todayIsoStr: string): number {
  return Math.round((isoToDay(targetIso) - isoToDay(todayIsoStr)) / MS_DAY);
}
