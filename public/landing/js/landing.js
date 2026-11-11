(function(){
'use strict';
const $=(s,c=document)=>c.querySelector(s), $$=(s,c=document)=>[...c.querySelectorAll(s)];
const rm=matchMedia('(prefers-reduced-motion: reduce)').matches;
const rp=n=>'Rp '+Math.round(n).toLocaleString('id-ID');
const ico=(n,cls='')=>`<svg class="${cls}" aria-hidden="true"><use href="#i-${n}"/></svg>`;
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let tt;
function toast(msg){const t=$('#toast');$('#toastT').textContent=msg;t.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('show'),3400)}

/* ---------- nav ---------- */
const nav=$('#nav'),links=$('#links'),mb=$('#menuBtn'),totop=$('#totop');
function onScroll(){const y=scrollY;nav.classList.toggle('scrolled',y>30);totop.classList.toggle('show',y>700)}
addEventListener('scroll',onScroll,{passive:true});onScroll();
function setMenu(o){links.classList.toggle('open',o);mb.setAttribute('aria-expanded',o);mb.setAttribute('aria-label',o?'Tutup menu':'Buka menu')}
mb.addEventListener('click',()=>setMenu(!links.classList.contains('open')));
links.addEventListener('click',e=>{if(e.target.closest('a'))setMenu(false)});
addEventListener('keydown',e=>{if(e.key==='Escape')setMenu(false)});
totop.addEventListener('click',()=>scrollTo({top:0,behavior:rm?'auto':'smooth'}));
$('#yr').textContent=new Date().getFullYear();
const secs=$$('main section[id]').filter(s=>$(`.links a[href="#${s.id}"]`));
if('IntersectionObserver' in window){
  const so=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){$$('.links a').forEach(a=>a.classList.toggle('active',a.getAttribute('href')==='#'+e.target.id))}}),{rootMargin:'-45% 0px -50% 0px'});
  secs.forEach(s=>so.observe(s));
}
const hero=$('#hero');
if(!rm)hero.addEventListener('pointermove',e=>{const r=hero.getBoundingClientRect();hero.style.setProperty('--mx',((e.clientX-r.left)/r.width*100)+'%');hero.style.setProperty('--my',((e.clientY-r.top)/r.height*100)+'%')});

/* ---------- strip ---------- */
const strip=['Apartemen','Kondominium','Gedung komersial','Asosiasi pemilik','Pengelola properti','Koordinator pemeliharaan','Komite penghuni','Vendor & kontraktor'];
$('#strip').innerHTML=[...strip,...strip].map(s=>`<span>${esc(s)}</span>`).join('');

/* ---------- hero map ---------- */
const NS='http://www.w3.org/2000/svg';
const units=[
 {id:'A-08-03',k:'both',ring:0,a:200,imp:'Akses ±2 jam · penutup pelindung',st:['Akses diminta','warn'],ben:'Pipa vertikal baru, kebocoran berhenti.'},
 {id:'A-08-04',k:'both',ring:0,a:320,imp:'Akses ±2 jam · jadwal alternatif diminta',st:['Pengaturan alternatif diminta','blue'],ben:'Pipa vertikal baru, kebocoran berhenti.'},
 {id:'A-08-05',k:'both',ring:0,a:80,imp:'Akses ±3 jam · pembersihan setelah kerja diminta',st:['Respons akses dikonfirmasi','ok'],ben:'Pipa vertikal baru, kebocoran berhenti.'},
 {id:'A-08-02',k:'dis',ring:0,a:260,imp:'Gangguan air sementara saat penyambungan',st:['Pemberitahuan terkirim','gray'],ben:'Tidak termasuk penerima manfaat langsung.'}
];
for(let i=6;i<=14;i++)units.push({id:'A-08-'+String(i).padStart(2,'0'),k:'ben',ring:1,a:0,imp:'Tidak perlu akses unit',st:['Menunggu umpan balik','gray'],ben:'Pasokan air lebih andal dari pipa bersama baru.'});
units.filter(u=>u.ring===1).forEach((u,i,arr)=>u.a=i*(360/arr.length)+10);
const roleTxt={both:['Penerima manfaat + akses diperlukan','blue'],ben:['Penerima manfaat','teal'],dis:['Terganggu sementara','gray']};
const map=$('#map'),C=260;
const el=(t,a={},p)=>{const e=document.createElementNS(NS,t);for(const k in a)e.setAttribute(k,a[k]);p&&p.appendChild(e);return e};
const defs=el('defs',{},map);const lg=el('linearGradient',{id:'gBoth',x1:0,y1:0,x2:1,y2:0},defs);
el('stop',{offset:'50%','stop-color':'#318B83'},lg);el('stop',{offset:'50%','stop-color':'#E4A34A'},lg);
const gE=el('g',{},map),gN=el('g',{},map);
function pos(u){const r=u.ring?195:112,t=(u.a-90)*Math.PI/180;return[C+r*Math.cos(t),C+r*Math.sin(t)]}
el('circle',{cx:C,cy:C,r:112,fill:'none',stroke:'rgba(255,255,255,.07)','stroke-dasharray':'2 6'},gE);
el('circle',{cx:C,cy:C,r:195,fill:'none',stroke:'rgba(255,255,255,.07)','stroke-dasharray':'2 6'},gE);
units.forEach(u=>{const[x,y]=pos(u);el('line',{x1:C,y1:C,x2:x,y2:y,class:'edge'},gE)});
const core=el('g',{},gN);
el('circle',{cx:C,cy:C,r:44,class:'core-ring'},core);
el('circle',{cx:C,cy:C,r:46,fill:'#0a1a28',stroke:'rgba(96,165,250,.6)','stroke-width':2},core);
el('use',{href:'#mark',x:C-32,y:C-32,width:64,height:64},core);
function sel(id){
  const u=units.find(x=>x.id===id);
  $$('.node',map).forEach(n=>{const on=n.dataset.id===id;n.classList.toggle('sel',on);n.setAttribute('aria-pressed',on)});
  const[rt,rc]=roleTxt[u.k];
  $('#detail').innerHTML=`<h4>Unit ${u.id} <span class="chip ${rc}">${rt}</span></h4><dl><dt>Manfaat</dt><dd>${u.ben}</dd><dt>Dampak</dt><dd>${u.imp}</dd><dt>Status</dt><dd><span class="chip ${u.st[1]}">${u.st[0]}</span></dd></dl><small>Peta ini menggambarkan konsekuensi operasional, bukan penilaian terhadap penghuni.</small>`;
}
units.forEach((u,i)=>{
  const[x,y]=pos(u);
  const g=el('g',{class:'node',tabindex:0,role:'button','aria-label':`Unit ${u.id}`,'aria-pressed':'false','data-id':u.id,style:`color:${u.k==='dis'?'#7C8FD8':u.k==='both'?'#E4A34A':'#318B83'};--d:${(i%5)*.4}s`},gN);
  el('circle',{cx:x,cy:y,r:20,class:'halo'},g);
  el('circle',{cx:x,cy:y,r:19,class:'body',fill:u.k==='dis'?'#7C8FD8':u.k==='both'?'url(#gBoth)':'#318B83',stroke:u.k==='both'?'#E4A34A':'rgba(255,255,255,.35)'},g);
  const t=el('text',{x,y},g);t.textContent=u.id.slice(2);
  g.addEventListener('click',()=>sel(u.id));
  g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();sel(u.id)}});
});
sel('A-08-04');

/* ---------- problem ---------- */
const Q=[['Siapa yang diuntungkan?','Penerima manfaat perbaikan dipetakan jelas, bukan diasumsikan.'],['Siapa yang harus memberi akses atau terganggu?','Dampak tiap unit dicatat: akses, kebisingan, gangguan layanan.'],['Tanggung jawab dan biaya apa yang perlu dipertimbangkan?','Skenario biaya disertai dasar kebijakan dan alasan yang bisa dibaca.'],['Alternatif apa yang meringankan beban?','Jadwal alternatif dan mitigasi ditawarkan sebelum konflik membesar.'],['Bagaimana mencapai kesepakatan tanpa paksaan?','Setiap keputusan dipisah, dicatat, dan dapat ditinjau ulang.']];
$('#qgrid').innerHTML=Q.map((q,i)=>`<div class="q reveal" style="--rd:${i*.08}s"><b>${i+1}</b><h3>${q[0]}</h3><p>${q[1]}</p></div>`).join('');

/* ---------- steps ---------- */
const S=[
 ['Assessment','Masalah teknis didokumentasikan lengkap dengan bukti. Asumsi yang belum terverifikasi tidak ditampilkan sebagai fakta.',['Laporan inspeksi & foto','Status: Belum terverifikasi → Terverifikasi','Verifikasi tanggung jawab fasilitas']],
 ['Pemetaan','Unit dibagi menjadi penerima manfaat dan unit yang perlu memberi akses atau mengalami gangguan. Satu unit bisa masuk keduanya.',['Peta dampak & pemangku kepentingan','Pembeda jelas: akses ≠ pembayaran','Profil dampak per unit']],
 ['Usulan','Skenario biaya dibangun dengan sumber dana, aturan, dan alasan. Disebut “usulan kontribusi” sampai pihak berwenang menetapkan kewajiban.',['Skenario A, B, C yang dapat diedit','Total harus sama dengan anggaran','Rencana akses & mitigasi']],
 ['Konsultasi','Usulan diterbitkan untuk umpan balik. Warga menjawab hal-hal terpisah: dukungan, akses, jadwal, dan kontribusi.',['Pusat Resolusi untuk setiap keberatan','Revisi dengan catatan perubahan','Tanpa persetujuan diam-diam']],
 ['Kesepakatan','Keputusan yang berwenang dicatat per jenis, lengkap dengan versi usulan, pembuat keputusan, dan bukti.',['Register kesepakatan','Peringatan bila dasar otorisasi belum dicatat','Pratinjau ringkasan & PDF']],
 ['Pelaksanaan','Vendor dikonfirmasi, akses diverifikasi, jadwal final terbit, dan progres dicatat dengan foto serta catatan.',['Perubahan material wajib ditinjau','Biaya tak terduga tercatat','Verifikasi akhir pekerjaan']],
 ['Selesai','Rekonsiliasi anggaran awal, disetujui, dan aktual. Laporan penyelesaian dapat diunduh, lalu proyek ditutup.',['Selisih anggaran terlihat','Item yang tersisa ditandai','Riwayat penuh dapat diaudit']]
];
const stepsEl=$('#steps'),fill=$('#stepFill');
S.forEach((s,i)=>{const b=document.createElement('button');b.className='step';b.type='button';b.setAttribute('role','tab');b.id='stp'+i;b.setAttribute('aria-controls','stepPanel');b.innerHTML=`<span class="dot">${i+1}</span><span class="l">${s[0]}</span>`;b.addEventListener('click',()=>{stopAuto();setStep(i)});stepsEl.appendChild(b)});
let cur=0,auto=null;
function setStep(i){
  cur=(i+S.length)%S.length;
  $$('.step',stepsEl).forEach((b,j)=>{b.classList.toggle('on',j===cur);b.classList.toggle('done',j<cur);b.setAttribute('aria-selected',j===cur);b.tabIndex=j===cur?0:-1});
  fill.style.width=(cur/(S.length-1)*86)+'%';
  const s=S[cur];
  $('#stepPanel').setAttribute('aria-labelledby','stp'+cur);
  $('#stepPanel').innerHTML=`<div><span class="chip teal">Tahap ${cur+1} dari ${S.length}</span><h3 style="margin-top:12px">${s[0]}</h3><p>${s[1]}</p><div class="step-ctrl"><button class="icon-btn" id="sPrev" type="button" aria-label="Tahap sebelumnya">${ico('left')}</button><button class="icon-btn" id="sNext" type="button" aria-label="Tahap berikutnya">${ico('right')}</button></div></div><ul>${s[2].map((x,k)=>`<li style="animation-delay:${k*.08}s">${ico('check')}<span>${x}</span></li>`).join('')}</ul>`;
  $('#sPrev').onclick=()=>{stopAuto();setStep(cur-1)};$('#sNext').onclick=()=>{stopAuto();setStep(cur+1)};
}
stepsEl.addEventListener('keydown',e=>{
  const nx=e.key==='ArrowRight'||e.key==='ArrowDown',pv=e.key==='ArrowLeft'||e.key==='ArrowUp';
  if(nx||pv){e.preventDefault();stopAuto();setStep(cur+(nx?1:-1));$$('.step',stepsEl)[cur].focus()}
});
function stopAuto(){clearInterval(auto);auto=null}
setStep(0);
if(!rm&&'IntersectionObserver' in window){new IntersectionObserver((es,o)=>{if(es[0].isIntersecting){auto=setInterval(()=>setStep(cur+1),3800);o.disconnect()}},{threshold:.6}).observe(stepsEl)}

/* ---------- features ---------- */
const F=[
 ['map','Impact & Stakeholder Mapping','Peta visual satu proyek ke tiap unit, dibedakan: penerima manfaat, akses diperlukan, terganggu, atau gabungan.',['Peta unit','Profil dampak'],0],
 ['scale','Fair Allocation Workspace','Bandingkan skenario biaya, lihat pratinjau kontribusi, dan baca “Mengapa alokasi ini?” tanpa skor kotak hitam.',['Skenario A/B/C','Riwayat revisi'],0],
 ['cal','Access & Schedule','Kalender akses per unit, opsi jadwal alternatif, dan konfirmasi eksplisit. Diam tidak pernah dianggap setuju.',['Minggu / Bulan / Daftar','Checklist mitigasi'],0],
 ['chat','Resolution Center','Setiap pertanyaan dan keberatan terhubung ke butir usulan. Tidak ada yang terkubur di chat atau dihapus diam-diam.',['Terstruktur','Dapat dieskalasi'],0],
 ['doc','Decisions & Agreements','Register keputusan dengan pembuat keputusan, versi, dan bukti. Ringkasan kesepakatan siap pratinjau dan cetak.',['5 jenis keputusan','PDF'],0],
 ['log','Riwayat yang tidak bisa dihapus','Siapa mengubah apa, nilai lama, nilai baru, dan kapan. Setiap revisi dan keputusan dapat ditelusuri.',['Jejak audit','Akses per peran'],1]
];
$('#bento').innerHTML=F.map((f,i)=>`<article class="fc ${i<2?'wide':''} ${f[4]?'dark':''} reveal" style="--rd:${(i%3)*.08}s"><div class="ic">${ico(f[0])}</div><h3>${f[1]}</h3><p>${f[2]}</p><div class="kw">${f[3].map(k=>`<span class="chip ${f[4]?'gray':'teal'}">${k}</span>`).join('')}</div></article>`).join('');

/* ---------- preview tilt ---------- */
const win=$('#win');
if(!rm&&matchMedia('(hover:hover)').matches){
  win.addEventListener('pointermove',e=>{const r=win.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;win.style.transform=`perspective(1400px) rotateY(${x*4}deg) rotateX(${-y*4}deg)`});
  win.addEventListener('pointerleave',()=>win.style.transform='');
}

/* ---------- simulator ---------- */
const TOTAL=18750000,STEP=1000;
const BEN=['A-08-03','A-08-04','A-08-05','A-08-06','A-08-07','A-08-08','A-08-09','A-08-10','A-08-11','A-08-12','A-08-13','A-08-14'];
const ACC=new Set(['A-08-03','A-08-04','A-08-05']);
const SC={
 A:{name:'Scenario A — Common Fund Dominant',tab:'A · Dana Bersama',pct:70,acc:1,basis:'Setara',why:'Sebagian besar biaya ditanggung dana pemeliharaan bersama (bila kebijakan gedung mengizinkan); sisanya dibagi setara antar unit penerima manfaat.',status:'Sedang ditinjau'},
 B:{name:'Scenario B — Shared Contribution',tab:'B · Kontribusi Bersama',pct:40,acc:1,basis:'Setara',why:'Dana bersama dan unit penerima manfaat berbagi biaya lebih seimbang. Semua unit penerima manfaat memiliki bobot sama.',status:'Diterbitkan untuk umpan balik'},
 C:{name:'Scenario C — Negotiated Arrangement',tab:'C · Negosiasi',pct:50,acc:.5,basis:'Bobot',why:'Unit yang menyediakan akses dan menanggung gangguan diberi bobot 0,5 sebagai bahan negosiasi. Ini kesepakatan sukarela dan memerlukan penjelasan tertulis serta persetujuan pihak berwenang.',status:'Draf'}
};
const state={cur:'A',pct:{A:70,B:40,C:50}};
function alloc(pct,acc){
  const fund=Math.round(TOTAL*pct/100/STEP)*STEP,owner=TOTAL-fund;
  const w=BEN.map(u=>ACC.has(u)?acc:1),sw=w.reduce((a,b)=>a+b,0);
  const raw=w.map(x=>owner*x/sw),base=raw.map(r=>Math.floor(r/STEP)*STEP);
  const rem=Math.round((owner-base.reduce((a,b)=>a+b,0))/STEP);
  raw.map((r,i)=>[r-base[i],i]).sort((a,b)=>b[0]-a[0]).slice(0,rem).forEach(([,i])=>base[i]+=STEP);
  return{fund,owner,amts:base};
}
const tabs=$('#simTabs');
Object.keys(SC).forEach(k=>{const b=document.createElement('button');b.type='button';b.className='tab';b.setAttribute('role','tab');b.dataset.k=k;b.textContent=SC[k].tab;b.addEventListener('click',()=>{state.cur=k;renderSim()});tabs.appendChild(b)});
tabs.addEventListener('keydown',e=>{const ks=Object.keys(SC),i=ks.indexOf(state.cur);if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();state.cur=ks[(i+(e.key==='ArrowRight'?1:ks.length-1))%ks.length];renderSim();$(`.tab[data-k="${state.cur}"]`,tabs).focus()}});
$('#fund').addEventListener('input',e=>{state.pct[state.cur]=+e.target.value;renderSim(true)});
$('#simReset').addEventListener('click',()=>{Object.keys(SC).forEach(k=>state.pct[k]=SC[k].pct);renderSim();toast('Nilai awal dikembalikan.')});
$('#simShare').addEventListener('click',()=>toast(`Draf “${SC[state.cur].name.split(' — ')[0]}” disimpan sebagai usulan. Belum menjadi kewajiban.`));
function renderSim(fromSlider){
  const k=state.cur,s=SC[k],pct=state.pct[k],a=alloc(pct,s.acc);
  $$('.tab',tabs).forEach(b=>{b.setAttribute('aria-selected',b.dataset.k===k);b.tabIndex=b.dataset.k===k?0:-1});
  $('#simName').textContent=s.name;
  if(!fromSlider)$('#fund').value=pct;
  $('#fund').setAttribute('aria-valuetext',pct+' persen');
  $('#fundV').textContent=pct+'%';
  $('#bars').innerHTML=Object.keys(SC).map(c=>{const p=state.pct[c];return`<div class="bar-row ${c===k?'act':''}"><span>Skenario ${c}</span><div class="bar"><i class="bf" style="width:${p}%">${p>=18?p+'%':''}</i><i class="bo" style="width:${100-p}%">${100-p>=18?(100-p)+'%':''}</i></div></div>`}).join('');
  $('#facts').innerHTML=`<div><span>Dana pemeliharaan bersama</span><b>${rp(a.fund)}</b></div><div><span>Usulan kontribusi unit</span><b>${rp(a.owner)}</b></div><div><span>Jumlah kontributor</span><b>${a.owner?12:0} unit</b></div><div><span>Status skenario</span><b>${s.status}</b></div>`;
  $('#why').innerHTML=`<b>Mengapa alokasi ini?</b>${s.why}`;
  $('#ctBody').innerHTML=BEN.map((u,i)=>`<tr><td><b>${u}</b>${ACC.has(u)?'<small>akses diperlukan</small>':''}</td><td>${s.basis==='Bobot'?(ACC.has(u)?'Bobot 0,5':'Bobot 1,0'):'Setara 1/12'}<small>${ACC.has(u)&&s.acc<1?'Mempertimbangkan akses & gangguan':'Penerima manfaat langsung'}</small></td><td class="am">${rp(a.amts[i])}</td></tr>`).join('');
  const ownerSum=a.amts.reduce((x,y)=>x+y,0);
  $('#ctSum').textContent=rp(ownerSum);
  const ok=a.fund+ownerSum===TOTAL&&a.amts.every(x=>x>=0);
  $('#simVal').innerHTML=ok?`<span style="color:var(--ok);font-weight:600">✓ Validasi lolos</span> · dana bersama + kontribusi = anggaran · dana belum teralokasi: <b>Rp 0</b>`:'<span style="color:var(--danger);font-weight:600">Total belum sama dengan anggaran</span>';
}
renderSim();

/* ---------- resident phone ---------- */
const R=[
 {key:'sup',tab:'Dukungan',q:'Apakah Anda mendukung perbaikan bersama ini?',opts:[['Saya mendukung perbaikan','Dukungan tercatat','ok'],['Saya butuh informasi tambahan','Informasi diminta','blue',1],['Saya memiliki kekhawatiran','Kekhawatiran diajukan','blue',1]]},
 {key:'acc',tab:'Akses',q:'Dapatkah tim memasuki unit Anda pada 14 Nov 2026?',opts:[['Saya dapat memberi akses','Akses terkonfirmasi','ok'],['Saya butuh jadwal alternatif','Pengaturan alternatif diminta','blue',1,'slot'],['Saya belum dapat memberi akses saat ini','Akses belum dikonfirmasi','gray',1],['Saya butuh informasi lebih lanjut','Informasi diminta','blue',1]]},
 {key:'con',tab:'Kontribusi',q:'Apakah Anda setuju dengan usulan pengaturan kontribusi?',opts:[['Saya setuju dengan usulan','Usulan disetujui unit ini','ok'],['Saya punya pertanyaan','Pertanyaan diajukan','blue',1],['Saya ingin mengusulkan alternatif','Alternatif diusulkan','blue',1],['Saya tidak setuju dengan usulan ini','Ketidaksetujuan tercatat','gray',1]]}
];
const rs={cur:0,done:{},pick:{}};
const ptabs=$('#ptabs'),form=$('#resForm'),hist=$('#hist');
function renderPhone(){
  ptabs.innerHTML=R.map((r,i)=>`<button type="button" class="pt" role="tab" aria-selected="${i===rs.cur}" tabindex="${i===rs.cur?0:-1}" data-i="${i}">${r.tab}<em>${rs.done[r.key]?'Tercatat':'Menunggu'}</em></button>`).join('');
  const r=R[rs.cur],p=rs.pick[r.key],o=p!=null?r.opts[p]:null;
  form.innerHTML=`<fieldset><legend>${r.q}</legend>${r.opts.map((x,i)=>`<label class="opt"><input type="radio" name="${r.key}" value="${i}" ${p===i?'checked':''}>${x[0]}</label>`).join('')}</fieldset>
  ${o&&o[3]?`<div class="extra">${o[4]==='slot'?`<label for="slot">Pilih waktu alternatif</label><select id="slot"><option>15 Nov 2026 · 09:00–12:00</option><option>15 Nov 2026 · 13:00–16:00</option><option>16 Nov 2026 · 09:00–12:00</option><option>Saya akan usulkan waktu lain</option></select>`:''}<label for="note">Catatan (opsional)</label><textarea id="note" maxlength="300" placeholder="Tulis kekhawatiran atau saran Anda…"></textarea></div>`:''}
  <button class="btn btn-primary" type="submit" style="width:100%" ${p==null?'disabled':''}>Kirim Respons</button>`;
}
ptabs.addEventListener('click',e=>{const b=e.target.closest('.pt');if(b){rs.cur=+b.dataset.i;renderPhone()}});
ptabs.addEventListener('keydown',e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();rs.cur=(rs.cur+(e.key==='ArrowRight'?1:2))%3;renderPhone();$$('.pt',ptabs)[rs.cur].focus()}});
form.addEventListener('change',e=>{if(e.target.type==='radio'){rs.pick[R[rs.cur].key]=+e.target.value;renderPhone();const c=$(`input[name="${R[rs.cur].key}"]:checked`,form);c&&c.focus()}});
form.addEventListener('submit',e=>{
  e.preventDefault();const r=R[rs.cur],p=rs.pick[r.key];if(p==null)return;
  const o=r.opts[p],slot=$('#slot'),note=$('#note');
  rs.done[r.key]=o[1];
  const li=document.createElement('li');
  li.innerHTML=`<b>${r.tab}</b> · <span class="chip ${o[2]}">${o[1]}</span><br><span style="color:var(--muted)">${slot?esc(slot.value)+' · ':''}${note&&note.value.trim()?'“'+esc(note.value.trim())+'” · ':''}Usulan v2 · ${new Date().toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'})} WIB</span>`;
  hist.prepend(li);
  rs.pick[r.key]=undefined;renderPhone();
  toast('Respons Anda sudah tercatat. Tim dapat meninjau dan menjawab melalui REMBUK.');
});
renderPhone();

/* ---------- roles ---------- */
const ROLES=[
 ['home','Administrator Gedung','Pengguna utama yang membuat dan mengoordinasikan proyek perbaikan bersama.',['Membuat proyek & memetakan unit','Menyusun skenario alokasi','Menyiapkan kesepakatan & laporan'],['Akses penuh untuk gedung yang ditugaskan','Mengikuti kebijakan organisasi']],
 ['tool','Koordinator Pemeliharaan','Mendokumentasikan masalah teknis dan menyiapkan pelaksanaan kerja.',['Mengunggah bukti inspeksi','Mengoordinasikan vendor & jadwal','Memantau progres pekerjaan'],['Mengelola data teknis & eksekusi','Tidak menetapkan kewajiban warga atau menimpa keputusan akses']],
 ['shield','Komite / Perwakilan','Meninjau usulan dan memberi persetujuan sesuai kewenangan.',['Memeriksa distribusi biaya','Meninjau keberatan','Mengonfirmasi keputusan'],['Dapat meninjau dan menyetujui dalam batas wewenang']],
 ['key','Pemilik Unit','Memahami manfaat dan ketidaknyamanan unitnya serta memberi keputusan terpisah.',['Meninjau kontribusi yang diusulkan','Menyetujui atau menolak akses','Mengajukan pertanyaan & jadwal alternatif'],['Hanya melihat informasi yang relevan untuk unitnya']],
 ['users','Penghuni / Penyewa','Menerima pemberitahuan dan mengonfirmasi ketersediaan dengan antarmuka sederhana.',['Meninjau permintaan akses','Mengajukan kekhawatiran','Melacak pekerjaan yang memengaruhi unit'],['Terbatas pada hal yang relevan untuk hunian dan keputusan yang berwenang']],
 ['clock','Vendor / Kontraktor','Mengerjakan pekerjaan yang ditugaskan dan melaporkan progresnya.',['Mengonfirmasi ketersediaan kerja','Mengunggah foto progres','Mengirim bukti penyelesaian'],['Hanya order kerja & informasi lokasi yang ditugaskan','Tidak dapat membuka seluruh basis data gedung']]
];
const rt=$('#rtabs'),rpn=$('#rpanel');let rc=0;
ROLES.forEach((r,i)=>{const b=document.createElement('button');b.type='button';b.className='rt';b.setAttribute('role','tab');b.id='rt'+i;b.innerHTML=ico(r[0])+r[1];b.addEventListener('click',()=>setRole(i));rt.appendChild(b)});
function setRole(i){
  rc=i;const r=ROLES[i];
  $$('.rt',rt).forEach((b,j)=>{b.setAttribute('aria-selected',j===i);b.tabIndex=j===i?0:-1});
  rpn.setAttribute('aria-labelledby','rt'+i);
  rpn.innerHTML=`<h3>${r[1]}</h3><p class="d">${r[2]}</p><div class="rcols"><div><h4>Tanggung jawab</h4><ul>${r[3].map((x,k)=>`<li style="animation-delay:${k*.07}s">${x}</li>`).join('')}</ul></div><div><h4>Batas akses</h4><ul>${r[4].map((x,k)=>`<li style="animation-delay:${k*.07+.2}s">${x}</li>`).join('')}</ul></div></div>`;
}
rt.addEventListener('keydown',e=>{if(['ArrowDown','ArrowUp','ArrowRight','ArrowLeft'].includes(e.key)){e.preventDefault();const d=(e.key==='ArrowDown'||e.key==='ArrowRight')?1:-1;setRole((rc+d+ROLES.length)%ROLES.length);$$('.rt',rt)[rc].focus()}});
setRole(0);

/* ---------- trust ---------- */
const YES=['Setiap keputusan dapat ditelusuri dan ditinjau','Dukungan, akses, jadwal, dan kontribusi adalah keputusan terpisah','Warga hanya melihat kontribusinya sendiri','Perbaikan darurat mengikuti prosedur darurat gedung, bukan alur persetujuan normal'];
const NO=['Tidak ada persetujuan diam-diam atau persetujuan paksa','Tidak ada skor kewajaran atau peringkat kerja sama warga','Tidak mengumumkan nama warga yang belum merespons','Tidak membuat kewajiban finansial hanya karena menekan tombol umpan balik'];
$('#yesL').innerHTML=YES.map(t=>`<li>${ico('check')}<span>${t}</span></li>`).join('');
$('#noL').innerHTML=NO.map(t=>`<li>${ico('x')}<span>${t}</span></li>`).join('');

/* ---------- faq ---------- */
const FQ=[
 ['Apakah REMBUK menggantikan aturan hukum atau keputusan pengelola?','Tidak. REMBUK mendukung keputusan manusia yang berwenang dan mendokumentasikannya. Hak akses dan kewajiban tetap mengikuti peraturan gedung, perjanjian properti, dan keputusan pihak berwenang.'],
 ['Apakah mendukung perbaikan berarti setuju membayar atau memberi akses?','Tidak. Dukungan perbaikan, izin akses, konfirmasi jadwal, dan respons terhadap usulan biaya adalah keputusan terpisah dengan catatan masing-masing.'],
 ['Siapa yang bisa melihat usulan kontribusi unit saya?','Hanya Anda dan pihak yang berwenang. Warga lain tidak dapat melihat kontribusi finansial unit Anda. Anda tetap dapat membaca penjelasan metode alokasi yang dibagikan.'],
 ['Bagaimana jika warga tidak merespons?','Statusnya tetap “Menunggu Keputusan”. Diam tidak dianggap setuju, dan nama warga tidak diumumkan secara publik.'],
 ['Bagaimana dengan perbaikan darurat?','Perbaikan darurat mengikuti prosedur darurat yang sah di gedung. REMBUK tidak mewajibkan alur persetujuan normal sebelum tindakan keselamatan mendesak dilakukan.'],
 ['Apakah ada skor kewajaran otomatis?','Tidak. REMBUK menampilkan dasar tanggung jawab, manfaat, dampak, kebijakan, dan alternatif yang dipertimbangkan sehingga orang dapat menilai sendiri alasannya.']
];
$('#faqList').innerHTML=FQ.map((f,i)=>`<div class="fq reveal" style="--rd:${i*.05}s"><h3><button type="button" aria-expanded="false" aria-controls="fa${i}" id="fb${i}">${f[0]}${ico('plus')}</button></h3><div class="ans" id="fa${i}" role="region" aria-labelledby="fb${i}"><div><p>${f[1]}</p></div></div></div>`).join('');
$('#faqList').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const f=b.closest('.fq'),o=!f.classList.contains('open');f.classList.toggle('open',o);b.setAttribute('aria-expanded',o)});

/* ---------- contact form (SIMULATED: no network call; wire to your backend/email service) ---------- */
const cf=$('#cForm'),cOk=$('#cOk');
const rules={cName:v=>v.trim().length>=2,cMail:v=>/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()),cOrg:v=>v.trim().length>=2,cRole:v=>!!v};
function chk(id){const i=$('#'+id),ok=rules[id](i.value);i.closest('.fld').classList.toggle('err',!ok);i.setAttribute('aria-invalid',!ok);return ok}
Object.keys(rules).forEach(id=>{const i=$('#'+id);i.addEventListener('blur',()=>chk(id));i.addEventListener('input',()=>{if(i.closest('.fld').classList.contains('err'))chk(id)})});
cf.addEventListener('submit',e=>{
  e.preventDefault();
  const bad=Object.keys(rules).filter(id=>!chk(id));
  if(bad.length){$('#'+bad[0]).focus();toast('Mohon lengkapi kolom yang ditandai.');return}
  const btn=$('#cBtn');btn.classList.add('loading');btn.disabled=true;$('#cBtnT').textContent='Mengirim…';
  setTimeout(()=>{
    btn.classList.remove('loading');btn.disabled=false;$('#cBtnT').textContent='Kirim Pesan';
    $('#cOkP').textContent=`Terima kasih, ${$('#cName').value.trim().split(' ')[0]}. Tim REMBUK akan menghubungi ${$('#cMail').value.trim()} dalam 1–2 hari kerja.`;
    cf.style.display='none';cOk.classList.add('show');cOk.setAttribute('tabindex','-1');cOk.focus();
    toast('Permintaan Anda tercatat.');
  },900);
});
$('#cAgain').addEventListener('click',()=>{cf.reset();$$('.fld',cf).forEach(f=>f.classList.remove('err'));cOk.classList.remove('show');cf.style.display='';$('#cName').focus()});

/* ---------- counters + reveal ---------- */
function count(el){
  const to=+el.dataset.count,pre=el.dataset.prefix||'',fmt=el.dataset.fmt;
  const f=v=>pre+(fmt?Math.round(v).toLocaleString('id-ID'):Math.round(v));
  if(rm){el.textContent=f(to);return}
  const t0=performance.now(),d=1400;
  (function tick(t){const p=Math.min(1,(t-t0)/d),e=1-Math.pow(1-p,3);el.textContent=f(to*e);if(p<1)requestAnimationFrame(tick)})(t0);
}
if('IntersectionObserver' in window){
  const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');$$('[data-count]',e.target).forEach(count);io.unobserve(e.target)}}),{threshold:.12});
  $$('.reveal').forEach(r=>io.observe(r));
}else{$$('.reveal').forEach(r=>r.classList.add('in'));$$('[data-count]').forEach(count)}

// self-check for allocation maths: logs only on failure
Object.keys(SC).forEach(k=>{for(let p=0;p<=100;p+=5){const a=alloc(p,SC[k].acc);if(a.fund+a.amts.reduce((x,y)=>x+y,0)!==TOTAL||a.amts.some(x=>x<0))console.error('Allocation mismatch',k,p)}});
})();
