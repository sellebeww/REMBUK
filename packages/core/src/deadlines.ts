// Copyright (c) 2026 Vassel Goleyu. All rights reserved.
import { daysUntil, parseIdDate } from './dates';

export type DeadlineLevel = 'overdue' | 'today' | 'soon' | 'upcoming' | 'later' | 'none';

export interface DeadlineOptions {
  /** Batas "segera" dalam hari (default 3). */
  soonDays?: number;
  /** Batas "akan datang" dalam hari (default 14). */
  horizonDays?: number;
}

export function deadlineLevel(targetIso: string | null | undefined, today: string, opt: DeadlineOptions = {}): DeadlineLevel {
  if (!targetIso) return 'none';
  const n = daysUntil(targetIso, today);
  if (Number.isNaN(n)) return 'none';
  if (n < 0) return 'overdue';
  if (n === 0) return 'today';
  if (n <= (opt.soonDays ?? 3)) return 'soon';
  if (n <= (opt.horizonDays ?? 14)) return 'upcoming';
  return 'later';
}

export interface DueProject {
  id: string;
  title: string;
  status: string;
  deadline?: string | null;
  units?: { id: string; access?: string; slot?: { d: string; t: string } | null }[];
}
export interface DueNote {
  id: string;
  title: string;
  pid?: string;
  /** Tenggat dalam format tampilan, mis. "14 Nov 2026"; "-" bila tidak ada. */
  deadline?: string;
  read?: boolean;
}

export interface DueItem {
  key: string;
  kind: 'project' | 'access' | 'note';
  pid: string;
  label: string;
  date: string;
  days: number;
  level: DeadlineLevel;
}

const CLOSED = new Set(['Completed', 'Cancelled']);
const NO_ACCESS_NEEDED = new Set(['Not Requested', 'Declined']);

/**
 * Kumpulkan hal yang berbatas waktu, diurutkan dari yang paling mendesak.
 * Hanya menampilkan; tidak mengirim apa pun. `mineUnitIds` membatasi jadwal akses ke unit tertentu (mis. unit milik warga).
 */
export function dueItems(
  projects: readonly DueProject[],
  notes: readonly DueNote[],
  today: string,
  opt: DeadlineOptions & { mineUnitIds?: readonly string[]; includeProjectDeadlines?: boolean } = {},
): DueItem[] {
  const out: DueItem[] = [];
  const push = (kind: DueItem['kind'], key: string, pid: string, label: string, date: string) => {
    const level = deadlineLevel(date, today, opt);
    if (level === 'none' || level === 'later') return;
    out.push({ key, kind, pid, label, date, days: daysUntil(date, today), level });
  };
  for (const p of projects) {
    if (CLOSED.has(p.status)) continue;
    if (opt.includeProjectDeadlines !== false && p.deadline) push('project', `p:${p.id}`, p.id, `Tenggat proyek: ${p.title}`, p.deadline);
    for (const u of p.units ?? []) {
      if (!u.slot || NO_ACCESS_NEEDED.has(u.access ?? '')) continue;
      if (opt.mineUnitIds && !opt.mineUnitIds.includes(u.id)) continue;
      push('access', `a:${p.id}:${u.id}`, p.id, `Akses unit ${u.id} (${u.slot.t}): ${p.title}`, u.slot.d);
    }
  }
  for (const n of notes) {
    if (n.read || !n.deadline) continue;
    const iso = parseIdDate(n.deadline);
    if (iso) push('note', `n:${n.id}`, n.pid ?? '', n.title, iso);
  }
  return out.sort((a, b) => a.days - b.days || a.key.localeCompare(b.key));
}
