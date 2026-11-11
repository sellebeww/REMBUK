<div align="center">

# REMBUK

### Satu perbaikan. Banyak kepentingan. Satu kesepakatan yang transparan.

<p>Platform koordinasi perbaikan bersama untuk pengelola gedung: petakan dampak, bandingkan skenario biaya, atur akses, dan catat setiap keputusan.</p>

<p><img src="https://img.shields.io/badge/Node.js-18%2B-339933?logo=nodedotjs&logoColor=white&labelColor=3a3f47" alt="Node.js 18+"> <img src="https://img.shields.io/badge/HTML%20%C2%B7%20CSS%20%C2%B7%20JS-tanpa%20dependensi-2F6FED?labelColor=3a3f47" alt="Tanpa dependensi"> <img src="https://img.shields.io/badge/mode-demo%20%28data%20fiktif%29-d4a017?labelColor=3a3f47" alt="mode demo (data fiktif)"> <img src="https://img.shields.io/badge/license-All%20rights%20reserved-1e3a8a?labelColor=3a3f47" alt="license All rights reserved"></p>

<p><i>Better Agreements. Shared Responsibility.</i></p>
</div>

Satu pipa bocor di gedung bersama melibatkan pemilik, penghuni, pengelola, dan vendor, masing-masing dengan kepentingan berbeda. REMBUK menjaga prosesnya tetap terlihat: siapa terdampak, siapa menanggung berapa, kapan akses dibutuhkan, dan apa yang akhirnya disepakati. Tidak ada keputusan yang dipaksakan; REMBUK mendukung keputusan pihak berwenang, bukan menggantikannya. Semua data contoh fiktif (Northpoint Residence).

## Tampilan

| | |
| --- | --- |
| **Profil perusahaan** (`/`): masalah, cara kerja, fitur, dan simulasi.<br>![Profil perusahaan](docs/screenshots/1-profil-perusahaan.png) | **Masuk cepat** (`/app/`): pilih peran tanpa kata sandi untuk mencoba demo.<br>![Masuk](docs/screenshots/2-masuk.png) |
| **Ikhtisar gedung**: proyek aktif, progres kesepakatan, dan tindakan yang menunggu.<br>![Ikhtisar](docs/screenshots/3-ikhtisar.png) | **Peta dampak**: siapa mendapat manfaat dan siapa terganggu, per unit.<br>![Peta dampak](docs/screenshots/4-dampak.png) |
| **Pusat resolusi**: setiap kekhawatiran tercatat dan tidak hilang di obrolan.<br>![Pusat resolusi](docs/screenshots/5-resolusi.png) | |

## Fitur utama

- **Proyek perbaikan** dengan tahapan jelas: penilaian, pemetaan pemangku kepentingan, usulan, konsultasi, kesepakatan, pelaksanaan, selesai.
- **Peta dampak** per unit: manfaat, ketidaknyamanan, kebutuhan akses, dan mitigasi. Menggambarkan konsekuensi operasional, bukan menilai penghuni.
- **Alokasi biaya adil**: bandingkan skenario pendanaan dan lihat alasan setiap usulan kontribusi. Istilahnya "Usulan Kontribusi"; kewajiban hanya ditetapkan pihak berwenang.
- **Akses & jadwal**: permintaan akses ke unit dengan opsi jadwal alternatif.
- **Pusat resolusi**: kekhawatiran warga tercatat, terhubung ke butir usulan, dan tidak dihapus diam-diam.
- **Tiga peran**: Building Management, Unit Owner, dan Maintenance Coordinator, masing-masing dengan menu berbeda.

## Menjalankan

Prasyarat: Node.js 18+. Tidak ada dependensi yang perlu dipasang.

```sh
npm run dev
```

Buka alamat yang tampil di terminal (biasanya http://localhost:3000): profil perusahaan di `/`, aplikasi di `/app/`. Tombol **Coba Demo** membuka aplikasi, dan tombol **Company Profile** di dalamnya kembali ke profil. Jika port 3000 dipakai, server otomatis mencoba port berikutnya; `PORT=4000 npm run dev` menetapkan port sendiri.

Masuk cepat tersedia tanpa kata sandi untuk ketiga peran. Akun uji: `admin@northpoint.id` / `rembuk123`. Menu akun menyediakan **Reset data contoh**.

## Struktur

```
public/
  index.html      profil perusahaan (landing)
  landing/        CSS dan JS landing
  app/            aplikasi: index.html, css/, js/ (data contoh dan fitur per peran)
server.js         server statis tanpa dependensi
docs/screenshots  gambar untuk README
```

## Batasan

- Prototipe: data contoh fiktif tersimpan di browser, tanpa server basis data, autentikasi nyata, atau integrasi eksternal.
- Pratinjau dokumen dan notifikasi disimulasikan.
- Diuji di Chrome desktop; browser lain belum diuji menyeluruh.

## Author & License

Created by Vassel Goleyu. Copyright (c) 2026 Vassel Goleyu. All rights reserved.
