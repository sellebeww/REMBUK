'use strict';
/* REMBUK demo — seed data (all fictional). */
const KEY='rembuk-demo-v2';
/* Unit milik pengguna demo yang sedang masuk (diatur saat masuk; lihat setSession). */
let MY='A-08-03';
/* Jam demo: data contoh berpusat pada Nov 2026, jadi mode demo memakai tanggal tetap agar tenggat tidak basi. Mode produksi memakai jam nyata. */
const DEMO_TODAY='2026-11-11';
const DEMO_UNIT={owner:'A-08-03',resident:'A-08-04'};
const STAGES=['Assessment','Stakeholder Mapping','Proposal','Consultation','Agreement','Execution','Completed'];
const STATUS_ID={'Draft':'Draf','Under Assessment':'Sedang Dinilai','Stakeholder Mapping':'Pemetaan Pemangku Kepentingan','Proposal Preparation':'Penyusunan Usulan','Awaiting Feedback':'Menunggu Umpan Balik','Proposal Revision':'Revisi Usulan','Awaiting Authorization':'Menunggu Otorisasi','Scheduled':'Terjadwal','In Progress':'Sedang Berjalan','Completed':'Selesai','Paused':'Dijeda','Disputed':'Dalam Sengketa','Cancelled':'Dibatalkan'};
const STATUS_TONE={'Draft':'gray','Under Assessment':'gray','Stakeholder Mapping':'blue','Proposal Preparation':'blue','Awaiting Feedback':'warn','Proposal Revision':'blue','Awaiting Authorization':'warn','Scheduled':'ok','In Progress':'teal','Completed':'ok','Paused':'gray','Disputed':'danger','Cancelled':'gray'};
const STAGE_OF={'Draft':0,'Under Assessment':0,'Stakeholder Mapping':1,'Proposal Preparation':2,'Proposal Revision':2,'Awaiting Feedback':3,'Awaiting Authorization':4,'Scheduled':5,'In Progress':5,'Completed':6};
const ACCESS_LBL={'Not Requested':['Belum Diminta','gray'],'Request Sent':['Permintaan Terkirim','warn'],'Accepted':['Diterima Warga','ok'],'Alternative Requested':['Alternatif Diminta','blue'],'Declined':['Akses Belum Dikonfirmasi','gray'],'Info Requested':['Informasi Diminta','blue'],'Confirmed':['Dikonfirmasi Koordinator','ok']};
const CONCERN_LBL={'New':['Baru','blue'],'Under Review':['Sedang Ditinjau','warn'],'Information Requested':['Informasi Diminta','blue'],'Alternative Proposed':['Alternatif Diusulkan','teal'],'Awaiting Resident Response':['Menunggu Respons Warga','warn'],'Resolved':['Terselesaikan','ok'],'Escalated':['Dieskalasi','danger'],'Closed':['Ditutup','gray']};
const CAT_GROUP={'Akses':'Kekhawatiran akses','Privasi':'Kekhawatiran akses','Jadwal':'Perubahan jadwal','Alokasi biaya':'Pertanyaan alokasi biaya','Lingkup perbaikan':'Pertanyaan teknis','Kebisingan/gangguan':'Permintaan mitigasi','Lainnya':'Umpan balik umum'};
const CATS=Object.keys(CAT_GROUP);
const DTYPES=['Dukungan perbaikan','Izin akses','Konfirmasi jadwal','Respons usulan finansial','Otorisasi manajemen'];
const EXEC_STEPS=['Konfirmasi vendor','Jadwal kerja final','Verifikasi akses yang diperlukan','Pekerjaan dimulai','Pembaruan progres','Inspeksi teknis','Pemulihan & pembersihan','Verifikasi akhir','Rekonsiliasi keuangan','Proyek selesai'];
const MIT_LIST=['Pemberitahuan lebih awal terkirim','Rute akses dikonfirmasi','Penutup pelindung disiapkan','Kontak warga dikonfirmasi','Gangguan utilitas sudah dijelaskan','Pembersihan setelah kerja diatur'];
const PROBLEM_CATS=['Plumbing','Electrical','Drainage','Shared ventilation','Structural common facility','Shared access facility','Other'];

function seed(){
  const U=(id,k,access='Not Requested',x={})=>({id,k,access,noise:'Tidak ada',water:'Tidak ada',dust:'Tidak ada',sev:'Rendah',mit:'',contact:'Belum dihubungi',chk:[0,0,0,0,0,0],...x});
  const R=(pre,fl,a,b,k='ben')=>{const o=[];for(let i=a;i<=b;i++)o.push(U(`${pre}-${String(fl).padStart(2,'0')}-${String(i).padStart(2,'0')}`,k));return o};
  const lines=t=>[{d:'Inspeksi',qty:1,price:t*.1,cat:'Inspeksi',quote:true},{d:'Tenaga kerja',qty:1,price:t*.3,cat:'Tenaga kerja',quote:true},{d:'Material',qty:1,price:t*.4,cat:'Material',quote:true},{d:'Pemulihan',qty:1,price:t*.2,cat:'Pemulihan',quote:true}];
  const sc=(a,b,c)=>({A:{pct:a,saved:a,acc:1,status:'Under Review',ver:1,policy:'Kebijakan Dana Pemeliharaan Bersama (contoh)',rev:[]},B:{pct:b,saved:b,acc:1,status:'Published for Feedback',ver:1,policy:'Kebijakan Kontribusi Bersama (contoh)',rev:[]},C:{pct:c,saved:c,acc:.5,status:'Draft',ver:1,policy:'',rev:[]}});
  const W=(o={})=>({vendor:'',done:0,notes:[],photos:[],extra:[],actual:null,review:false,...o});
  const P=(o)=>({priority:'Normal',mgr:'Sari Wulandari',pub:'B',loc:'',summary:'',objective:'Menghentikan masalah dan memulihkan fungsi fasilitas bersama.',outcome:'Fasilitas bersama berfungsi andal tanpa gangguan berulang.',assess:'Verified',updated:'10 Nov 2026',prev:null,...o});
  const projects=[
   P({id:'RMB-2026-014',title:'Common Water Pipe Replacement',tower:'Tower A',cat:'Plumbing / Common Facility',priority:'High',status:'Awaiting Feedback',stage:3,deadline:'2026-11-20',loc:'Tower A — Shared Vertical Pipe System',
     summary:'Pipa air vertikal bersama perlu diganti setelah inspeksi teknis menemukan kebocoran dan penurunan kondisi. Perbaikan menguntungkan banyak unit tetapi membutuhkan akses sementara ke beberapa unit privat untuk inspeksi dan pemasangan.',
     updated:'11 Nov 2026',
     costs:[{d:'Inspeksi',qty:1,price:1250000,cat:'Inspeksi',quote:true},{d:'Tenaga kerja',qty:1,price:5500000,cat:'Tenaga kerja',quote:true},{d:'Material pipa',qty:1,price:7000000,cat:'Material',quote:true},{d:'Persiapan akses',qty:1,price:1250000,cat:'Persiapan akses',quote:true},{d:'Pemulihan',qty:1,price:2500000,cat:'Pemulihan',quote:false},{d:'Pembersihan',qty:1,price:1250000,cat:'Pembersihan',quote:true}],
     sc:sc(70,40,50),
     units:[U('A-08-02','dis','Not Requested',{water:'Sedang',noise:'Rendah',sev:'Sedang',mit:'Pemberitahuan 3 hari sebelumnya',contact:'Pemberitahuan terkirim'}),
       U('A-08-03','both','Request Sent',{slot:{d:'2026-11-14',t:'09:00–12:00'},dur:'2 jam',tech:2,noise:'Sedang',dust:'Rendah',sev:'Sedang',mit:'Penutup pelindung sebelum kerja',contact:'Kontak dikonfirmasi',chk:[1,1,0,1,0,0]}),
       U('A-08-04','both','Alternative Requested',{slot:{d:'2026-11-14',t:'09:00–12:00'},dur:'2 jam',tech:2,noise:'Sedang',sev:'Sedang',mit:'Jadwal alternatif sore hari',reason:'Saya bekerja pagi hari; bisa sore hari.',contact:'Kontak dikonfirmasi',chk:[1,1,0,1,0,0]}),
       U('A-08-05','both','Accepted',{slot:{d:'2026-11-14',t:'13:00–16:00'},dur:'3 jam',tech:2,noise:'Sedang',dust:'Sedang',sev:'Sedang',mit:'Pembersihan setelah kerja',contact:'Kontak dikonfirmasi',chk:[1,1,1,1,0,0]}),
       ...R('A',8,6,14)],
     work:W()}),
   P({id:'RMB-2026-013',title:'Electrical Distribution Inspection',tower:'Tower B',cat:'Electrical',status:'Proposal Revision',stage:2,deadline:'2026-12-05',loc:'Tower B — Panel Distribusi Lantai 3–5',updated:'10 Nov 2026',
     summary:'Inspeksi panel distribusi listrik bersama setelah laporan penurunan tegangan berulang.',costs:lines(42500000),sc:sc(60,40,50),
     units:[...R('B',3,1,2,'both').map(u=>({...u,access:'Request Sent',slot:{d:'2026-11-18',t:'09:00–12:00'},dur:'2 jam',tech:2,noise:'Rendah',sev:'Rendah'})),...R('B',3,3,7),...R('B',4,1,7),...R('B',5,1,4)],work:W()}),
   P({id:'RMB-2026-012',title:'Shared Drainage Repair',tower:'Tower A',cat:'Drainage',status:'Scheduled',stage:5,deadline:'2026-11-28',priority:'High',loc:'Tower A — Saluran Pembuangan Vertikal',updated:'09 Nov 2026',
     summary:'Perbaikan saluran drainase bersama yang tersumbat dan bocor pada lantai 4.',costs:lines(31250000),sc:sc(70,50,50),pub:'A',
     units:[...R('A',4,1,4,'both').map(u=>({...u,access:'Confirmed',slot:{d:'2026-11-22',t:'09:00–12:00'},dur:'3 jam',tech:2,noise:'Sedang',sev:'Sedang',chk:[1,1,1,1,1,0]})),...R('A',4,5,7),...R('A',5,1,7),...R('A',6,1,6),U(MY,'ben')],work:W({vendor:'PT Tirta Mandiri',done:2})}),
   P({id:'RMB-2026-011',title:'Roof Waterproofing — Common Area',tower:'Tower B',cat:'Structural common facility',status:'Stakeholder Mapping',stage:1,deadline:'2027-01-15',loc:'Tower B — Atap Area Bersama',updated:'08 Nov 2026',
     summary:'Pelapisan ulang waterproofing atap area bersama untuk menghentikan rembesan.',costs:lines(38000000),sc:sc(70,40,50),
     units:[...R('B',6,1,2,'both'),...R('B',6,3,7),...R('B',7,1,7),...R('B',8,1,7),...R('B',9,1,3)],work:W()}),
   P({id:'RMB-2026-010',title:'Lift Panel Replacement',tower:'Tower A',cat:'Shared access facility',status:'In Progress',stage:5,deadline:'2026-11-18',priority:'High',loc:'Tower A — Ruang Mesin Lift',updated:'11 Nov 2026',
     summary:'Penggantian panel kontrol lift yang sering mengalami gangguan.',costs:lines(29000000),sc:sc(80,50,50),pub:'A',
     units:[...R('A',1,1,1,'both').map(u=>({...u,access:'Confirmed',slot:{d:'2026-11-12',t:'09:00–12:00'},dur:'2 jam',tech:2,chk:[1,1,1,1,1,1]})),...R('A',2,1,7),...R('A',3,1,7),...R('A',5,1,5)],work:W({vendor:'CV Lift Nusantara',done:4})}),
   P({id:'RMB-2026-009',title:'Shared Ventilation Duct Cleaning',tower:'Tower B',cat:'Shared ventilation',status:'Under Assessment',stage:0,deadline:'2027-02-10',assess:'Under Review',loc:'Tower B — Saluran Ventilasi Utama',updated:'07 Nov 2026',
     summary:'Pembersihan saluran ventilasi bersama; lingkup masih dalam penilaian teknis.',costs:lines(27000000),sc:sc(70,40,50),units:[],work:W()}),
   P({id:'RMB-2026-008',title:'Lobby Ceiling Repair',tower:'Tower A',cat:'Structural common facility',status:'Completed',stage:6,deadline:'2026-10-15',loc:'Tower A — Lobi Utama',updated:'16 Okt 2026',
     summary:'Perbaikan plafon lobi akibat rembesan.',costs:lines(12000000),sc:sc(100,100,100),pub:'A',units:R('A',1,1,5),work:W({vendor:'PT Griya Karya',done:10,actual:11400000})})
  ];
  const T=(who,role,text,t)=>({who,role,text,t});
  const concerns=[
   {id:'C-101',pid:'RMB-2026-014',unit:'A-08-04',cat:'Jadwal',item:'Jadwal akses 14 Nov, 09:00–12:00',desc:'Saya bekerja pagi hari. Apakah bisa dijadwalkan sore hari?',sugg:'Sore hari, 13:00–16:00',status:'New',date:'10 Nov 2026',coord:'Dimas Prakoso',thread:[T('A-08-04','res','Saya bekerja pagi hari. Apakah bisa dijadwalkan sore hari?','10 Nov 2026, 19:20 WIB')]},
   {id:'C-102',pid:'RMB-2026-014',unit:'A-08-05',cat:'Kebisingan/gangguan',item:'Mitigasi: pembersihan setelah kerja',desc:'Mohon ada pembersihan setelah pekerjaan karena ada anak kecil di unit.',sugg:'Tim pembersihan 1 jam setelah kerja',status:'Under Review',date:'09 Nov 2026',coord:'Dimas Prakoso',thread:[T('A-08-05','res','Mohon ada pembersihan setelah pekerjaan karena ada anak kecil di unit.','09 Nov 2026, 10:05 WIB'),T('Dimas Prakoso','staff','Terima kasih. Kami cek ketersediaan tim pembersih dan kabari hari ini.','09 Nov 2026, 14:30 WIB')]},
   {id:'C-103',pid:'RMB-2026-014',unit:'A-08-09',cat:'Alokasi biaya',item:'Skenario B — dasar alokasi setara',desc:'Mengapa unit yang tidak dilewati pipa tetap berkontribusi sama?',sugg:'',status:'Information Requested',date:'08 Nov 2026',coord:'Sari Wulandari',thread:[T('A-08-09','res','Mengapa unit yang tidak dilewati pipa tetap berkontribusi sama?','08 Nov 2026, 20:11 WIB'),T('Sari Wulandari','staff','Semua unit penerima manfaat memakai pipa bersama yang sama. Kami lampirkan dasar kebijakan pada dokumen usulan.','09 Nov 2026, 09:00 WIB')]}
  ];
  const D=(id,pid,type,unit,by,ver,date,status,basis,note)=>({id,pid,type,unit,by,ver,date,status,basis,note});
  const decisions=[
   D('D-1','RMB-2026-014','Dukungan perbaikan','A-08-05','Pemilik unit A-08-05','v1','09 Nov 2026','Tercatat','','Mendukung perbaikan.'),
   D('D-2','RMB-2026-014','Izin akses','A-08-05','Pemilik unit A-08-05','v1','09 Nov 2026','Tercatat','','Akses 14 Nov 13:00–16:00 diterima.'),
   D('D-3','RMB-2026-014','Respons usulan finansial','A-08-05','Pemilik unit A-08-05','v1','09 Nov 2026','Tercatat','','Setuju dengan usulan Skenario B (belum menjadi kewajiban).'),
   D('D-4','RMB-2026-012','Otorisasi manajemen','—','Komite Pemilik (Ketua)','v1','05 Nov 2026','Tercatat','Notulen Rapat Komite 05/11/2026 (contoh)','Pekerjaan dan skenario A disetujui.'),
   D('D-5','RMB-2026-012','Konfirmasi jadwal','Semua unit akses','Dimas Prakoso (Koordinator)','v1','07 Nov 2026','Tercatat','','Jadwal 22 Nov dikonfirmasi.')
  ];
  const activity=[
   {t:'11 Nov 2026, 09:12 WIB',who:'Unit A-08-04',what:'Meminta jadwal akses alternatif',prev:'Permintaan Terkirim',next:'Alternatif Diminta',pid:'RMB-2026-014'},
   {t:'10 Nov 2026, 16:40 WIB',who:'Sari Wulandari',what:'Merevisi Skenario B dan menerbitkan untuk umpan balik',prev:'Draf',next:'Diterbitkan untuk umpan balik',pid:'RMB-2026-014'},
   {t:'10 Nov 2026, 11:05 WIB',who:'Dimas Prakoso',what:'Mengunggah laporan inspeksi',prev:'—',next:'Laporan Inspeksi Pipa.pdf',pid:'RMB-2026-014'},
   {t:'09 Nov 2026, 15:22 WIB',who:'Unit A-08-05',what:'Mengonfirmasi jendela akses yang diusulkan',prev:'Permintaan Terkirim',next:'Diterima Warga',pid:'RMB-2026-014'},
   {t:'09 Nov 2026, 10:00 WIB',who:'Komite Pemilik',what:'Meninjau usulan kontribusi',prev:'—',next:'Ditinjau',pid:'RMB-2026-013'}
  ];
  const N=(id,to,cat,title,body,pid,why,action,deadline,read)=>({id,to,cat,title,body,pid,why,action,deadline,read:!!read,t:'11 Nov 2026'});
  const notes=[
   N('n1','mgmt','Schedule update','Unit A-08-04 meminta jadwal alternatif','Warga meminta waktu akses lain untuk RMB-2026-014.','RMB-2026-014','Anda koordinator proyek ini.','Tinjau dan usulkan waktu revisi','14 Nov 2026'),
   N('n2','mgmt','New concern response','Pertanyaan baru tentang alokasi biaya','Unit A-08-09 mengajukan pertanyaan pada Skenario B.','RMB-2026-014','Anda ditugaskan pada konsultasi biaya.','Jawab di Resolution Center','13 Nov 2026'),
   N('n3','mgmt','Approval required','Revisi usulan menunggu tinjauan komite','Proyek RMB-2026-013 membutuhkan tinjauan perwakilan.','RMB-2026-013','Anda pengelola proyek ini.','Tinjau revisi','—',1),
   N('r1','res','Access request','Permintaan akses untuk unit Anda','Tim pemeliharaan membutuhkan akses sementara ke unit Anda untuk inspeksi pipa bersama.','RMB-2026-014','Unit A-08-03 berada pada jalur pipa vertikal.','Tinjau permintaan akses sebelum 13 Nov 2026','13 Nov 2026'),
   N('r2','res','Cost proposal published','Usulan kontribusi diterbitkan untuk umpan balik','Anda dapat meninjau usulan kontribusi unit Anda dan memberi tanggapan.','RMB-2026-014','Unit Anda termasuk penerima manfaat.','Tinjau usulan (belum menjadi kewajiban)','17 Nov 2026'),
   N('v1','vend','Work progress','Jadwal kerja RMB-2026-012 dikonfirmasi','Jadwal 22 Nov dikonfirmasi koordinator. Lihat jadwal akses unit pada menu Jadwal.','RMB-2026-012','Anda vendor yang ditugaskan pada proyek ini.','Siapkan tim sesuai jadwal','22 Nov 2026'),
   N('r3','res','Work progress','Jadwal perbaikan drainase terkonfirmasi','Perbaikan RMB-2026-012 dijadwalkan 22 Nov. Unit Anda tidak memerlukan akses.','RMB-2026-012','Unit Anda penerima manfaat proyek ini.','Tidak ada tindakan','—',1)
  ];
  const DOC=(id,pid,name,cat,vis,size,by,date)=>({id,pid,name,cat,vis,size,by,date});
  const docs=[
   DOC('f1','RMB-2026-014','Laporan Inspeksi Pipa.pdf','Inspection reports','all','2,4 MB','Dimas Prakoso','10 Nov 2026'),
   DOC('f2','RMB-2026-014','Penawaran Vendor — Material.pdf','Vendor quotations','mgmt','860 KB','Dimas Prakoso','08 Nov 2026'),
   DOC('f3','RMB-2026-014','Usulan Perbaikan v1.pdf','Repair proposals','all','1,1 MB','Sari Wulandari','10 Nov 2026'),
   DOC('f4','RMB-2026-014','Kebijakan Dana Pemeliharaan (contoh).pdf','Building policies','all','420 KB','Sari Wulandari','01 Okt 2026'),
   DOC('f5','RMB-2026-014','Catatan Persetujuan Akses.xlsx','Consent records','mgmt','95 KB','Sari Wulandari','11 Nov 2026'),
   DOC('f6','RMB-2026-012','Notulen Rapat Komite 05-11-2026.pdf','Consent records','mgmt','310 KB','Komite Pemilik','05 Nov 2026'),
   DOC('f7','RMB-2026-008','Laporan Penyelesaian — Plafon Lobi.pdf','Completion reports','all','1,8 MB','Dimas Prakoso','16 Okt 2026'),
   DOC('f8','RMB-2026-008','Invoice Akhir.pdf','Final invoices','mgmt','210 KB','PT Griya Karya','15 Okt 2026'),
   DOC('f9','RMB-2026-012','Instruksi Kerja Lapangan (contoh).pdf','Work instructions','vendor','540 KB','Dimas Prakoso','07 Nov 2026')
  ];
  const users=[['Sari Wulandari','Administrator Gedung','Aktif'],['Dimas Prakoso','Koordinator Pemeliharaan','Aktif'],['Komite Pemilik','Komite / Perwakilan','Aktif'],['Alex Pratama','Pemilik Unit (A-08-03)','Aktif'],['PT Tirta Mandiri','Vendor','Aktif'],['Maya Lestari','Penghuni (A-08-04)','Aktif'],['Bima Sakti','Penghuni (A-08-07)','Nonaktif']];
  const events=activity.slice().reverse().reduce((l,a)=>RembukCore.appendEvent(l,{at:a.t,actor:a.who,pid:a.pid,action:a.what,prev:a.prev,next:a.next}),[]);
  return {session:null,projects,concerns,decisions,events,notes,docs,users,seq:{p:15,c:104,d:6,n:10,f:10},prefs:{email:true,wa:false,reminder:'Sedang'},rhist:[]};
}
