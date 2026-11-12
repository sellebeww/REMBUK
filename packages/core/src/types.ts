// Copyright (c) 2026 Vassel Goleyu. All rights reserved.

/** Peran pihak dalam satu gedung. */
export type Role = 'manager' | 'owner' | 'resident' | 'vendor';

/** Jenis keterlibatan unit: ben = penerima manfaat, acc = penyedia akses, both = keduanya, dis = terganggu. */
export type UnitKind = 'ben' | 'acc' | 'both' | 'dis';

export interface CostLine {
  d: string;
  qty: number;
  price: number;
  cat?: string;
  quote?: boolean;
}

export interface UnitRef {
  id: string;
  k: UnitKind;
}

export interface Scenario {
  /** Persentase biaya yang ditutup dana bersama (0..100). */
  pct: number;
  /** Bobot kontribusi unit "both" (penyedia akses) relatif terhadap unit "ben" (bobot 1). */
  acc: number;
}

export interface AllocationRow {
  id: string;
  amt: number;
  w: number;
  acc: boolean;
}

export interface Allocation {
  /** Total biaya (Rupiah bulat). */
  T: number;
  /** Bagian dana bersama. */
  fund: number;
  /** Bagian yang diusulkan dibagi ke unit penerima manfaat. */
  owner: number;
  rows: AllocationRow[];
  /** Bagian yang belum dapat dibagi (mis. tidak ada unit penerima manfaat). */
  unassigned: number;
  /** fund + jumlah porsi unit; selalu sama dengan T bila unassigned = 0. */
  sum: number;
  /** Peringatan pembulatan/validasi yang perlu ditampilkan, bila ada. */
  warnings: string[];
}
