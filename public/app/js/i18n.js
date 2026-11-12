'use strict';
/* Copyright (c) 2026 Vassel Goleyu. REMBUK: katalog bahasa. Default: id. Kunci yang belum diterjemahkan jatuh ke id.
   Cakupan saat ini: navigasi dan layar masuk. String lain masih tertanam dan perlu dipindah bertahap (lihat docs/IMPROVEMENT-PLAN.md). */
const CATALOGS={
  id:{
    'nav.overview':'Ikhtisar','nav.projects':'Proyek Perbaikan','nav.impact':'Dampak & Pemangku Kepentingan','nav.cost':'Alokasi Biaya','nav.access':'Akses & Jadwal',
    'nav.resolution':'Pusat Resolusi','nav.decisions':'Keputusan & Kesepakatan','nav.exec':'Pelaksanaan Pekerjaan','nav.reports':'Laporan & Analitik','nav.buildings':'Gedung & Unit',
    'nav.docs':'Dokumen','nav.notif':'Notifikasi','nav.settings':'Pengaturan','nav.r-overview':'Beranda Saya','nav.r-requests':'Permintaan Perbaikan','nav.r-access':'Akses & Jadwal',
    'nav.r-proposals':'Usulan','nav.r-docs':'Dokumen','nav.profile':'Profil Saya','nav.v-overview':'Proyek Saya','nav.v-schedule':'Jadwal Kerja','nav.v-work':'Pelaksanaan','nav.v-docs':'Dokumen',
    'login.title':'Selamat datang kembali','login.sub':'Masuk untuk melanjutkan koordinasi perbaikan dan kesepakatan gedung bersama.','login.email':'Alamat email','login.pass':'Kata sandi',
    'login.remember':'Ingat saya','login.forgot':'Lupa kata sandi?','login.submit':'Masuk','lang.label':'Bahasa',
  },
  en:{
    'nav.overview':'Overview','nav.projects':'Repair Projects','nav.impact':'Impact & Stakeholders','nav.cost':'Cost Allocation','nav.access':'Access & Schedule',
    'nav.resolution':'Resolution Center','nav.decisions':'Decisions & Agreements','nav.exec':'Work Execution','nav.reports':'Reports & Analytics','nav.buildings':'Buildings & Units',
    'nav.docs':'Documents','nav.notif':'Notifications','nav.settings':'Settings','nav.r-overview':'My Overview','nav.r-requests':'Repair Requests','nav.r-access':'Access & Schedule',
    'nav.r-proposals':'Proposals','nav.r-docs':'Documents','nav.profile':'My Profile','nav.v-overview':'My Projects','nav.v-schedule':'Work Schedule','nav.v-work':'Execution','nav.v-docs':'Documents',
    'login.title':'Welcome back','login.sub':'Sign in to continue managing shared building repairs and agreements.','login.email':'Email address','login.pass':'Password',
    'login.remember':'Remember me','login.forgot':'Forgot password?','login.submit':'Sign In','lang.label':'Language',
  },
};
let LANG='id';
try{const l=localStorage.getItem('rembuk-lang');if(l&&CATALOGS[l])LANG=l}catch(e){}
let I18=RembukCore.createI18n(CATALOGS,LANG);
const t=(k,p)=>I18.t(k,p);
const navLabel=i=>{const v=t('nav.'+i[0]);return v==='nav.'+i[0]?i[1]:v};
document.documentElement.lang=LANG;
