# Rencana Peningkatan REMBUK

Pemilik: Vassel Goleyu. Dokumen ini ditulis sebelum pekerjaan dimulai dan diperbarui seiring jalan.

## 1. Audit keadaan awal

Dibaca: README, `package.json`, `vercel.json`, `server.js`, seluruh `public/app/js` (data, core, wizard, management, resident), `index.html`.

**Bentuk kode.** Situs statis: landing (`public/index.html`) dan aplikasi (`public/app/`) berupa JavaScript global (~200 KB, ditulis padat), tanpa modul, tanpa build, tanpa tes. Seluruh keadaan satu objek `S` di `localStorage`. Peran (`admin`, `coord`, `owner`) hanya membedakan menu di sisi klien (`can()`, `allowed()`).

**Temuan.**

| # | Temuan | Dampak |
|---|--------|--------|
| 1 | Tidak ada peran vendor dan tidak ada penghuni (hanya pemilik) | Tidak sesuai kasus nyata empat pihak |
| 2 | Izin hanya di klien; siapa pun bisa mengubah `localStorage` | Tidak aman untuk multi-pihak |
| 3 | `alloc()` tidak membatasi persentase dana (nilai negatif atau >100 menghasilkan porsi negatif) | Bug pembagian biaya |
| 4 | `alloc()` memakai kenaikan 1000 hanya jika total kelipatan 1000; harga/jumlah pecahan atau negatif tidak divalidasi | Pembulatan tidak konsisten, total bisa tidak sama dengan jumlah porsi |
| 5 | Tanggal "hari ini" dan kalender ditanam (Nov 2026); tidak ada logika tenggat | Tenggat tidak bisa dihitung secara nyata |
| 6 | Pemisahan pihak terdampak tersebar di `affected()`, `benUnits()`, `accUnits()`, tanpa aturan tertulis | Sulit diuji |
| 7 | Unit pengguna warga ditanam (`MY='A-08-03'`) | Tidak bisa multi-pengguna |
| 8 | Log aktivitas (`S.activity`) dapat diubah/dihapus bebas | Tidak tahan-ubah |
| 9 | Unduh PDF "disimulasikan"; pratinjau WhatsApp hanya tiruan; notifikasi hanya tiruan | Klaim fitur tidak nyata |
| 10 | `localStorage` dibaca tanpa validasi skema | Data rusak dapat membuat aplikasi macet |
| 11 | Teks UI campuran Inggris dan Indonesia, string tertanam di kode | Belum siap i18n |
| 12 | Tidak ada manifest/service worker, tidak ada CI, tidak ada tes | Tidak dapat dipakai offline, tidak ada pengaman regresi |

Bug tambahan yang ditemukan lewat uji E2E dicatat di bagian "Hasil audit runtime" di bawah.

## 2. Keputusan stack

**Kerangka UI: tetap vanilla JS yang ada, bukan Next.js.** Alasan:
1. Aturan 5 (fitur tidak boleh hilang): menulis ulang ~200 KB UI ke React/Next membawa risiko regresi besar tanpa tes UI yang ada.
2. Aplikasi sepenuhnya sisi klien dan interaktif; tidak ada kebutuhan SSR atau SEO untuk area aplikasi (yang butuh SEO adalah landing, yang sudah statis).
3. Vercel melayani statis dengan mudah; biaya nol.
4. Jalur migrasi bertahap tersedia: logika bisnis dipindah ke paket TypeScript murni sehingga UI apa pun dapat memakainya.

**Tambahan.**
- `packages/core`: TypeScript murni, tanpa dependensi, diuji dengan Vitest. Di-bundle oleh esbuild menjadi `public/app/js/vendor/rembuk-core.js` (global `RembukCore`) yang dipakai UI.
- Supabase (Postgres, Auth, Realtime, RLS) untuk backend. Migrasi di `supabase/migrations`. Kebijakan RLS diuji dengan PGlite (Postgres WASM, tanpa layanan eksternal) lewat skrip tes Vitest; pgTAP tidak dipakai karena butuh server Postgres.
- Mode demo tetap penuh tanpa akun: data fiktif lokal. Mode Supabase aktif hanya jika `config.js` berisi URL dan kunci anon (lihat `.env.example`).
- PDF: penulis PDF teks minimal di `packages/core` (tanpa dependensi), diuji validitas strukturnya.
- Lint: ESLint + typescript-eslint. Typecheck: `tsc --noEmit`. E2E: Playwright (Chromium terpasang).

## 3. Model data (Postgres)

Peran: `manager` (pengelola), `owner` (pemilik), `resident` (penghuni), `vendor`.

| Tabel | Isi | Baca | Tulis |
|-------|-----|------|-------|
| `buildings` | gedung | anggota gedung | manajer |
| `units` | unit (kode, tower, lantai) | anggota gedung | manajer |
| `profiles` | nama tampilan per pengguna | diri sendiri; manajer gedung yang sama | diri sendiri |
| `memberships` | pengguna x gedung x peran (+ unit atau vendor) | diri sendiri; manajer | manajer |
| `vendors` | perusahaan vendor | manajer; vendor anggotanya | manajer |
| `projects` | proyek perbaikan, status, tahap, tenggat | manajer: semua; owner/resident: proyek yang melibatkan unitnya; vendor: proyek yang ditugaskan | manajer |
| `project_units` | unit terlibat: jenis (manfaat/akses/keduanya/terganggu), status akses, jadwal, dampak | manajer: semua; owner/resident: hanya baris unitnya; vendor: baris jadwal akses proyeknya | manajer; unit lewat fungsi `respond_access` |
| `cost_lines` | rincian biaya | manajer; owner/resident proyeknya (usulan, bukan kewajiban); vendor proyeknya | manajer |
| `scenarios` | skenario A/B/C: persen dana, bobot, versi, status | manajer; pihak proyek bila status diterbitkan | manajer |
| `scenario_revisions` | revisi skenario (append-only) | seperti `scenarios` | manajer |
| `concerns` | kekhawatiran per unit | manajer; unit pengaju | unit pengaju (insert); manajer (ubah status) |
| `concern_messages` | utas (append-only) | seperti `concerns` | pengaju, manajer |
| `decisions` | keputusan/persetujuan tercatat (append-only) | manajer; unit terkait; keputusan tingkat proyek bagi pihak proyek | manajer; unit (jenis respons warga) |
| `documents` | dokumen dengan visibilitas `all`/`mgmt`/`vendor` | sesuai visibilitas | manajer |
| `work_steps` | langkah eksekusi | manajer; vendor penugasan; pihak proyek (baca) | manajer; vendor penugasan |
| `event_log` | log kejadian append-only dengan rantai hash | manajer: gedung; pihak proyek: proyeknya | hanya pemicu (SECURITY DEFINER); UPDATE/DELETE diblokir |
| `reminder_prefs` | preferensi pengingat tenggat per pengguna | diri sendiri | diri sendiri |

Prinsip privasi: warga tidak melihat baris unit lain; vendor tidak melihat kekhawatiran, keputusan keuangan, maupun identitas penghuni (hanya kode unit dan jadwal akses). Ringkasan agregat untuk warga (jumlah unit terdampak) lewat fungsi `project_summary()`.

## 4. Urutan kerja (satu commit per perubahan logis)

1. Dokumen rencana ini.
2. Perkakas: TypeScript, Vitest, ESLint, esbuild, skrip npm.
3. `packages/core`: pembagian biaya, pihak terdampak, tenggat, rantai hash log, ekspor teks/PDF, validasi keadaan; tes unit.
4. Hubungkan UI ke `RembukCore` (hapus duplikasi `alloc`, `total`, dst.); perbaiki bug yang ditemukan.
5. Peran penghuni dan vendor pada mode demo; unit pengguna tidak lagi ditanam.
6. Log kejadian append-only di UI (verifikasi rantai).
7. Ekspor: PDF nyata dan teks WhatsApp (pengguna yang menekan kirim; tidak ada pengiriman otomatis).
8. Pengingat tenggat (daftar di aplikasi + notifikasi peramban hanya atas izin pengguna).
9. PWA: manifest, service worker, ikon; offline.
10. i18n (katalog `id`, kunci siap bahasa lain) dan aksesibilitas, tampilan 360 px.
11. Supabase: migrasi, RLS, seed fiktif, tes RLS (PGlite), adaptor klien, `.env.example`.
12. E2E Playwright.
13. CI (`ci.yml`), `vercel.json`, README lengkap.
14. PR draf ke `main`.

## 5. Batas yang dijaga

- Data demo fiktif (Northpoint Residence); bukan nasihat hukum. REMBUK tidak menetapkan kewajiban: istilah "Usulan Kontribusi" dipertahankan, manusia memutuskan.
- Tidak ada kredensial Supabase asli; tidak ada layanan berbayar; tidak ada pengiriman pesan otomatis.
- Mode Supabase belum diuji terhadap instance Supabase nyata; yang diuji: skema dan RLS (PGlite), pemetaan data, dan klien dengan klien palsu. Ini dinyatakan di README dan PR.

## 6. Hasil audit runtime

E2E penyapu semua halaman (5 peran) tidak menemukan galat JavaScript. Bug logika yang ditemukan lewat pembacaan kode dan tes, semuanya sudah diperbaiki:

- Cek "Persentase dana bersama + kontribusi unit = 100%" selalu bernilai benar (ditanam `true`); kini dihitung.
- Label "Pendanaan eksternal (terverifikasi) Rp 0" mengklaim verifikasi tanpa data; kini "Belum dicatat".
- Tenggat karangan ('17 Nov', '13 Nov') ditanam pada notifikasi baru; dihapus.
- Slot akses bawaan dan "hari ini" ditanam pada tanggal tetap; kini memakai jam demo atau jam nyata.
- Klaim "catatan bergaya immutable" pada riwayat aktivitas tidak benar (daftar bebas ubah); kini log berantai hash dengan verifikasi.
- Setelah peran vendor ditambahkan, halaman notifikasi sempat menampilkan notifikasi pengelola (kebocoran); diperbaiki dan diuji.
- Pada RLS: `verify_event_chain` awalnya dapat dipanggil non-pengelola karena `current_user` dalam SECURITY DEFINER; ditemukan tes, diperbaiki. Baris draf proyek sempat terlihat lewat tabel turunan; kini dibatasi di fungsi bantu.
- Kontras warna (WCAG AA), nama tombol pemilih gedung pada 360 px, dan area tabel yang dapat digulir tanpa fokus keyboard diperbaiki berdasarkan axe.
