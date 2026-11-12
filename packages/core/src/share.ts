// Copyright (c) 2026 Vassel Goleyu. All rights reserved.
import { formatIdDate } from './dates';

export interface ShareCase {
  id: string;
  title: string;
  building: string;
  tower?: string;
  status: string;
  deadline?: string | null;
  total: number;
  fund: number;
  parties: { beneficiaries: number; access: number; disturbed: number };
  scenarioLabel: string;
  versionLabel: string;
  openConcerns: number;
  nextAction?: string;
  /** Peringatan jujur yang wajib ikut: data demo, bukan keputusan final. */
  isDemo: boolean;
}

export const DISCLAIMER =
  'Ringkasan ini bersifat informasi dan usulan. Bukan keputusan final, bukan nasihat hukum, dan tidak menetapkan kewajiban pembayaran. Keputusan ada pada pihak berwenang dan para pemangku kepentingan.';

const rp = (n: number): string => 'Rp ' + Math.round(n).toLocaleString('id-ID');

/** Teks ringkas siap tempel ke WhatsApp (format: *tebal*, _miring_). Tanpa data pribadi penghuni. */
export function whatsappText(c: ShareCase): string {
  const lines = [
    `*REMBUK: ${c.title}*`,
    `${c.id} | ${c.building}${c.tower ? ', ' + c.tower : ''}`,
    `Status: ${c.status}`,
    c.deadline ? `Tenggat: ${formatIdDate(c.deadline)}` : '',
    '',
    `Perkiraan biaya: ${rp(c.total)}`,
    `Usulan dana bersama: ${rp(c.fund)} (${c.scenarioLabel}, ${c.versionLabel})`,
    `Pihak: ${c.parties.beneficiaries} unit penerima manfaat, ${c.parties.access} unit perlu akses, ${c.parties.disturbed} unit terganggu`,
    `Kekhawatiran terbuka: ${c.openConcerns}`,
    c.nextAction ? `Langkah berikutnya: ${c.nextAction}` : '',
    '',
    `_${DISCLAIMER}_`,
    c.isDemo ? '_Data demo fiktif._' : '',
  ];
  return lines.filter((l, i, a) => !(l === '' && (a[i - 1] === '' || i === 0))).join('\n').trim();
}

/** Tautan wa.me berisi teks. Pengguna sendiri yang menekan kirim di WhatsApp; tidak ada pengiriman otomatis. */
export const whatsappUrl = (text: string): string => 'https://wa.me/?text=' + encodeURIComponent(text);

import type { PdfDoc } from './pdf';

export interface CaseDetail extends ShareCase {
  summary: string;
  generatedAt: string;
  accessLines: string[];
  costLines: { d: string; amt: number }[];
  decisions: string[];
}

/** Dokumen PDF ringkasan kasus. Tidak memuat nama penghuni; unit disebut dengan kode. */
export function caseToPdf(c: CaseDetail): PdfDoc {
  const b: PdfDoc['blocks'] = [
    { t: 'h1', text: 'Ringkasan Kasus Perbaikan Bersama' },
    { t: 'p', text: `${c.id} | ${c.title}` },
    { t: 'small', text: `${c.building}${c.tower ? ', ' + c.tower : ''} | Dibuat ${c.generatedAt}${c.isDemo ? ' | DATA DEMO FIKTIF' : ''}` },
    { t: 'h2', text: 'Masalah' },
    { t: 'p', text: c.summary || '-' },
    { t: 'h2', text: 'Status' },
    { t: 'p', text: `${c.status}${c.deadline ? ', tenggat ' + formatIdDate(c.deadline) : ''}. Kekhawatiran terbuka: ${c.openConcerns}.` },
    { t: 'h2', text: 'Pihak terlibat' },
    { t: 'li', text: `${c.parties.beneficiaries} unit penerima manfaat` },
    { t: 'li', text: `${c.parties.access} unit perlu akses sementara` },
    { t: 'li', text: `${c.parties.disturbed} unit terganggu` },
    { t: 'h2', text: 'Rincian biaya (perkiraan)' },
    ...c.costLines.map((l) => ({ t: 'li' as const, text: `${l.d}: ${rp(l.amt)}` })),
    { t: 'p', text: `Total perkiraan: ${rp(c.total)}. Usulan dana bersama: ${rp(c.fund)} (${c.scenarioLabel}, ${c.versionLabel}).` },
    { t: 'h2', text: 'Akses dan jadwal' },
    ...(c.accessLines.length ? c.accessLines.map((l) => ({ t: 'li' as const, text: l })) : [{ t: 'p' as const, text: 'Tidak ada permintaan akses.' }]),
    { t: 'h2', text: 'Keputusan dan persetujuan tercatat' },
    ...(c.decisions.length ? c.decisions.map((l) => ({ t: 'li' as const, text: l })) : [{ t: 'p' as const, text: 'Belum ada.' }]),
    { t: 'gap' },
    { t: 'small', text: DISCLAIMER },
  ];
  return { title: `Ringkasan ${c.id}`, author: 'REMBUK', blocks: b, footer: 'REMBUK' };
}
