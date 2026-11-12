// Copyright (c) 2026 Vassel Goleyu. All rights reserved.

/** Pemeriksaan bentuk minimum data tersimpan (localStorage). Menolak data rusak agar aplikasi tidak macet. */
export function isValidState(raw: unknown): boolean {
  if (!raw || typeof raw !== 'object') return false;
  const s = raw as Record<string, unknown>;
  const arrays = ['projects', 'concerns', 'decisions', 'activity', 'notes', 'docs', 'users'];
  if (!arrays.every((k) => Array.isArray(s[k]))) return false;
  if (!s.seq || typeof s.seq !== 'object') return false;
  return (s.projects as unknown[]).every((p) => {
    const o = p as Record<string, unknown>;
    return !!o && typeof o.id === 'string' && typeof o.title === 'string' && Array.isArray(o.costs) && Array.isArray(o.units) && !!o.sc && typeof o.sc === 'object';
  });
}

/** Baca JSON tersimpan; kembalikan null bila rusak atau tidak sesuai bentuk. */
export function parseStoredState(json: string | null): unknown | null {
  if (!json) return null;
  try {
    const v: unknown = JSON.parse(json);
    return isValidState(v) ? v : null;
  } catch {
    return null;
  }
}
