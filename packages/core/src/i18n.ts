// Copyright (c) 2026 Vassel Goleyu. All rights reserved.

export type Catalog = Record<string, string>;
export type Catalogs = Record<string, Catalog>;

/** Pencari terjemahan. Locale default: id. Kunci yang belum ada di locale lain jatuh ke id, lalu ke kunci itu sendiri. */
export function createI18n(catalogs: Catalogs, locale = 'id', fallback = 'id') {
  const t = (key: string, params: Record<string, string | number> = {}): string => {
    const raw = catalogs[locale]?.[key] ?? catalogs[fallback]?.[key] ?? key;
    return raw.replace(/\{(\w+)\}/g, (m, k: string) => (k in params ? String(params[k]) : m));
  };
  return { t, locale };
}

/** Kunci yang ada di katalog acuan tetapi hilang di katalog lain (untuk tes kelengkapan). */
export function missingKeys(catalogs: Catalogs, ref = 'id'): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  const base = Object.keys(catalogs[ref] ?? {});
  for (const [loc, cat] of Object.entries(catalogs)) {
    if (loc === ref) continue;
    const miss = base.filter((k) => !(k in cat));
    if (miss.length) out[loc] = miss;
  }
  return out;
}
