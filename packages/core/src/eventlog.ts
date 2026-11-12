// Copyright (c) 2026 Vassel Goleyu. All rights reserved.
import { sha256Hex } from './sha256';

/** Satu entri log kejadian. `hash` mengikat isi entri dan hash entri sebelumnya (rantai). */
export interface LogEntry {
  seq: number;
  at: string;
  actor: string;
  pid: string;
  action: string;
  prev: string;
  next: string;
  prevHash: string;
  hash: string;
}

export type LogInput = Omit<LogEntry, 'seq' | 'prevHash' | 'hash'>;

export const GENESIS_HASH = '0'.repeat(64);

/** Serialisasi kanonik: urutan field tetap, dipisah karakter yang tidak muncul pada teks biasa. */
export function canonical(e: Omit<LogEntry, 'hash'>): string {
  return JSON.stringify([e.seq, e.at, e.actor, e.pid, e.action, e.prev, e.next, e.prevHash]);
}

export function hashEntry(e: Omit<LogEntry, 'hash'>): string {
  return sha256Hex(canonical(e));
}

/** Tambah entri ke ujung rantai. Mengembalikan daftar baru (tidak mengubah masukan). */
export function appendEvent(log: readonly LogEntry[], input: LogInput): LogEntry[] {
  const last = log[log.length - 1];
  const base = { seq: last ? last.seq + 1 : 1, ...input, prevHash: last ? last.hash : GENESIS_HASH };
  return [...log, { ...base, hash: hashEntry(base) }];
}

export type ChainResult = { ok: true; length: number } | { ok: false; brokenAt: number; reason: string };

/**
 * Periksa rantai. Mendeteksi isi yang diubah, entri dihapus/disisipkan, atau urutan diubah.
 * Catatan jujur: rantai hash di sisi klien mendeteksi perubahan diam-diam, tetapi tidak mencegah
 * seseorang yang menulis ulang seluruh rantai. Perlindungan penuh ada pada basis data (pemicu dan RLS).
 */
export function verifyChain(log: readonly LogEntry[]): ChainResult {
  let prevHash = GENESIS_HASH;
  for (let i = 0; i < log.length; i++) {
    const e = log[i] as LogEntry;
    if (e.seq !== i + 1) return { ok: false, brokenAt: i, reason: 'Nomor urut tidak berurutan (entri hilang atau disisipkan).' };
    if (e.prevHash !== prevHash) return { ok: false, brokenAt: i, reason: 'Tautan ke entri sebelumnya tidak cocok.' };
    const { hash, ...rest } = e;
    if (hashEntry(rest) !== hash) return { ok: false, brokenAt: i, reason: 'Isi entri berbeda dari yang tercatat.' };
    prevHash = hash;
  }
  return { ok: true, length: log.length };
}
