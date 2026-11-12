// Copyright (c) 2026 Vassel Goleyu. All rights reserved.

/** Lebar glif Helvetica (per 1000 em) untuk ASCII 32..126. */
const W = [
  278, 278, 355, 556, 556, 889, 667, 191, 333, 333, 389, 584, 278, 333, 278, 278, 556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 278, 278, 584, 584, 584, 556,
  1015, 667, 667, 722, 722, 667, 611, 778, 722, 278, 500, 667, 556, 833, 722, 778, 667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 278, 278, 278, 469, 556,
  333, 556, 556, 500, 556, 556, 278, 556, 556, 222, 222, 500, 222, 833, 556, 556, 556, 556, 333, 500, 278, 556, 500, 722, 500, 500, 500, 334, 260, 334, 584,
];

export type PdfBlock = { t: 'h1' | 'h2' | 'p' | 'li' | 'small'; text: string } | { t: 'gap' };
export interface PdfDoc {
  title: string;
  author?: string;
  blocks: PdfBlock[];
  footer?: string;
}

const STYLE = {
  h1: { size: 17, lead: 22, bold: true, before: 0, after: 6 },
  h2: { size: 12.5, lead: 17, bold: true, before: 10, after: 2 },
  p: { size: 10.5, lead: 14, bold: false, before: 0, after: 4 },
  li: { size: 10.5, lead: 14, bold: false, before: 0, after: 1 },
  small: { size: 8.5, lead: 11.5, bold: false, before: 4, after: 2 },
} as const;

/** Ubah ke WinAnsi (Latin-1 + beberapa tanda baca umum); selain itu "?". */
function toWin(s: string): number[] {
  const map: Record<string, number> = { '–': 150, '—': 151, '‘': 145, '’': 146, '“': 147, '”': 148, '•': 149, '…': 133 };
  const out: number[] = [];
  for (const ch of s.normalize('NFC')) {
    const c = ch.codePointAt(0) as number;
    if (c === 10 || c === 9) out.push(32);
    else if (c >= 32 && c <= 126) out.push(c);
    else if (c >= 160 && c <= 255) out.push(c);
    else out.push(map[ch] ?? 63);
  }
  return out;
}

const widthOf = (codes: number[], size: number, bold: boolean): number =>
  codes.reduce((a, c) => a + ((c >= 32 && c <= 126 ? (W[c - 32] as number) : 556) * (bold ? 1.06 : 1) * size) / 1000, 0);

function wrap(text: string, size: number, bold: boolean, maxW: number): number[][] {
  const lines: number[][] = [];
  let cur: number[] = [];
  for (const word of toWin(text).reduce<number[][]>((acc, c) => { if (c === 32) acc.push([]); else (acc[acc.length - 1] as number[]).push(c); return acc; }, [[]])) {
    if (!word.length) continue;
    const trial = cur.length ? [...cur, 32, ...word] : word;
    if (widthOf(trial, size, bold) <= maxW || !cur.length) cur = trial;
    else { lines.push(cur); cur = word; }
    while (widthOf(cur, size, bold) > maxW && cur.length > 1) { // kata sangat panjang: potong
      let n = cur.length - 1;
      while (n > 1 && widthOf(cur.slice(0, n), size, bold) > maxW) n--;
      lines.push(cur.slice(0, n)); cur = cur.slice(n);
    }
  }
  if (cur.length) lines.push(cur);
  return lines.length ? lines : [[]];
}

const esc = (codes: number[]): string => codes.map((c) => (c === 40 || c === 41 || c === 92 ? '\\' + String.fromCharCode(c) : c < 32 || c > 126 ? '\\' + c.toString(8).padStart(3, '0') : String.fromCharCode(c))).join('');
const bin = (s: string): Uint8Array => Uint8Array.from(s, (ch) => ch.charCodeAt(0) & 255);

/** Penulis PDF teks minimal (A4, Helvetica). Cukup untuk ringkasan kasus; bukan pustaka PDF umum. */
export function buildPdf(doc: PdfDoc): Uint8Array {
  const PW = 595.28, PH = 841.89, M = 56, maxW = PW - 2 * M, bottom = 60;
  const pages: string[][] = [[]];
  let y = PH - M;
  const put = (codes: number[], size: number, bold: boolean, x: number) => {
    (pages[pages.length - 1] as string[]).push(`BT /${bold ? 'F2' : 'F1'} ${size} Tf ${x.toFixed(2)} ${y.toFixed(2)} Td (${esc(codes)}) Tj ET`);
  };
  for (const b of doc.blocks) {
    if (b.t === 'gap') { y -= 8; continue; }
    const st = STYLE[b.t];
    const indent = b.t === 'li' ? 14 : 0;
    y -= st.before;
    const text = b.text;
    const lines = wrap(text, st.size, st.bold, maxW - indent);
    lines.forEach((ln, i) => {
      if (y - st.lead < bottom) { pages.push([]); y = PH - M; }
      y -= st.lead;
      if (b.t === 'li' && i === 0) put([149], st.size, false, M + 2);
      put(ln, st.size, st.bold, M + indent);
    });
    y -= st.after;
  }
  const total = pages.length;
  const footer = doc.footer ?? '';
  pages.forEach((p, i) => {
    const f = toWin(`${footer}${footer ? '  |  ' : ''}Halaman ${i + 1} dari ${total}`);
    p.push(`BT /F1 8 Tf ${M} 36 Td (${esc(f)}) Tj ET`);
  });

  const objs: Uint8Array[] = [];
  const add = (s: string | Uint8Array): number => { objs.push(typeof s === 'string' ? bin(s) : s); return objs.length; };
  add('<< /Type /Catalog /Pages 2 0 R >>');
  const firstPage = 5;
  add(`<< /Type /Pages /Kids [${pages.map((_, i) => `${firstPage + i * 2} 0 R`).join(' ')}] /Count ${total} >>`);
  add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');
  add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');
  pages.forEach((p, i) => {
    add(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PW} ${PH}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${firstPage + i * 2 + 1} 0 R >>`);
    const stream = p.join('\n');
    add(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
  });
  const info = add(`<< /Title (${esc(toWin(doc.title))}) /Author (${esc(toWin(doc.author ?? 'REMBUK'))}) /Producer (REMBUK) >>`);

  const parts: Uint8Array[] = [bin('%PDF-1.4\n')];
  const offsets: number[] = [];
  let pos = parts[0]!.length;
  objs.forEach((o, i) => {
    offsets.push(pos);
    const chunk = [bin(`${i + 1} 0 obj\n`), o, bin('\nendobj\n')];
    chunk.forEach((c) => { parts.push(c); pos += c.length; });
  });
  let xref = `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n`;
  offsets.forEach((o) => { xref += `${String(o).padStart(10, '0')} 00000 n \n`; });
  parts.push(bin(xref + `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R /Info ${info} 0 R >>\nstartxref\n${pos}\n%%EOF\n`));
  const outLen = parts.reduce((a, p) => a + p.length, 0);
  const out = new Uint8Array(outLen);
  let o = 0;
  parts.forEach((p) => { out.set(p, o); o += p.length; });
  return out;
}

