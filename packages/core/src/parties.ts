// Copyright (c) 2026 Vassel Goleyu. All rights reserved.
import type { UnitKind, UnitRef } from './types';

/**
 * Aturan pihak terdampak (dipakai UI dan basis data):
 * - penerima manfaat: ben atau both
 * - penyedia akses: acc atau both (butuh akses sementara ke unit)
 * - terganggu: dis (tidak mendapat manfaat langsung, menanggung gangguan)
 * - terdampak: semua yang bukan murni ben, yaitu butuh akses atau terganggu
 */
export const isBeneficiary = (k: UnitKind): boolean => k === 'ben' || k === 'both';
export const isAccessProvider = (k: UnitKind): boolean => k === 'acc' || k === 'both';
export const isDisturbed = (k: UnitKind): boolean => k === 'dis';
export const isAffected = (k: UnitKind): boolean => k !== 'ben';

export interface PartySummary {
  beneficiaries: number;
  access: number;
  disturbed: number;
  affected: number;
  total: number;
}

export function summarizeParties(units: readonly UnitRef[]): PartySummary {
  return {
    beneficiaries: units.filter((u) => isBeneficiary(u.k)).length,
    access: units.filter((u) => isAccessProvider(u.k)).length,
    disturbed: units.filter((u) => isDisturbed(u.k)).length,
    affected: units.filter((u) => isAffected(u.k)).length,
    total: units.length,
  };
}

/** Unit yang sama tidak boleh muncul dua kali dalam satu proyek. Mengembalikan kode unit ganda. */
export function duplicateUnits(units: readonly UnitRef[]): string[] {
  const seen = new Set<string>();
  const dup = new Set<string>();
  for (const u of units) (seen.has(u.id) ? dup : seen).add(u.id);
  return [...dup];
}
