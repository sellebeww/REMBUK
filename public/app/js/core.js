'use strict';
/* REMBUK demo — core: state, helpers, router, shell, login, overlays */
function load(){try{const j=localStorage.getItem(KEY);if(j)return JSON.parse(j)}catch(e){}return seed()}
function save(){try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}}
let S=load();
const ui={view:null,args:[],menu:null,modal:null,drawer:null,nav:false,f:{},q:'',stF:'',towF:'',prioF:'',before:'',stageF:null,pview:'list',pid:'RMB-2026-014',sc:'A',cal:'month',btab:'info',stab:'org',cStF:'',cCatF:'',nCat:'',docCat:'',uq:'',uT:'',dT:'',dP:'',rtab:'support',rP:'',rT:'',rS:'',wiz:null,wstep:1,werr:{},thumbs:{},selUnit:null,mapF:{},login:{email:'',pass:'',show:false,remember:true,eE:'',pE:'',err:'',loading:false,ok:false}};

/* ---------- helpers ---------- */
const $=(s,c=document)=>c.querySelector(s);
const $$=(s,c=document)=>[...c.querySelectorAll(s)];
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const rp=n=>'Rp '+Math.round(n).toLocaleString('id-ID');
const now=()=>{const d=new Date();return d.toLocaleDateString('id-ID',{day:'2-digit',month:'short',year:'numeric'})+', '+String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0')+' WIB'};
const fdate=iso=>{if(!iso)return '—';const [y,m,d]=iso.split('-');return `${d} ${['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'][+m-1]} ${y}`};
const ICON={home:'<path d="M4 11l8-6.5 8 6.5M6 10v9.5h12V10"/>',wrench:'<path d="M14.5 6.5a4 4 0 005 5L10 21a2.1 2.1 0 01-3-3L16.5 8.5"/><path d="M14.5 6.5l3-3 3 3-3 3z"/>',map:'<circle cx="12" cy="12" r="2.5"/><circle cx="5" cy="6" r="1.8"/><circle cx="19" cy="6" r="1.8"/><circle cx="5" cy="18" r="1.8"/><circle cx="19" cy="18" r="1.8"/><path d="M6.4 7.2l3.6 3.4M17.6 7.2l-3.6 3.4M6.4 16.8l3.6-3.4M17.6 16.8l-3.6-3.4"/>',scale:'<path d="M12 4v16M7 20h10M5 8h14"/><path d="M5 8l-2.5 6a3 3 0 005 0zM19 8l-2.5 6a3 3 0 005 0z"/>',cal:'<rect x="3.5" y="5" width="17" height="15" rx="2.5"/><path d="M8 3v4M16 3v4M3.5 10h17M8 14.5l2.5 2.5 5-5"/>',chat:'<path d="M4 5.5h16v10H12l-5 4v-4H4z"/><path d="M8 9.5h8M8 12.5h5"/>',doc:'<path d="M6 3.5h8l4 4v13H6z"/><path d="M14 3.5v4h4M9 12h6M9 15.5h6"/>',tool:'<path d="M4 20l9-9M13 11l-2-4 3-3 4 2 2 4-3 3z"/>',chart:'<path d="M4 20V5M4 20h16M8 16v-5M12 16V8M16 16v-3"/>',building:'<path d="M5 20V4h10v16M15 9h4v11M3 20h18M8 8h2M8 12h2M8 16h2"/>',folder:'<path d="M3.5 6.5h6l2 2h9v10h-17z"/>',bell:'<path d="M6 16V11a6 6 0 0112 0v5l1.5 2h-15zM10 20a2 2 0 004 0"/>',gear:'<circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1"/>',search:'<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/>',help:'<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 015 .5c0 1.7-2.5 2-2.5 3.7M12 17h.01"/>',user:'<circle cx="12" cy="8.5" r="3.5"/><path d="M5 20c.8-3.6 3.6-5.5 7-5.5s6.2 1.9 7 5.5"/>',check:'<path d="M5 12.5l4.5 4.5L19 7"/>',x:'<path d="M6 6l12 12M18 6L6 18"/>',plus:'<path d="M12 5v14M5 12h14"/>',arrow:'<path d="M5 12h14M13 6l6 6-6 6"/>',left:'<path d="M15 6l-6 6 6 6"/>',right:'<path d="M9 6l6 6-6 6"/>',down:'<path d="M6 10l6 6 6-6"/>',up:'<path d="M6 14l6-6 6 6"/>',shield:'<path d="M12 3l7.5 3v5.5c0 4.5-3.2 8-7.5 9.5-4.3-1.5-7.5-5-7.5-9.5V6z"/><path d="M8.8 12l2.3 2.3 4.2-4.6"/>',clock:'<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',upload:'<path d="M12 16V5M7 9l5-5 5 5M5 20h14"/>',menu:'<path d="M4 7h16M4 12h16M4 17h16"/>',eye:'<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',log:'<path d="M4 5h16M4 10h10M4 15h16M4 20h10"/>',alert:'<path d="M12 4l9 16H3z"/><path d="M12 10v4M12 17h.01"/>',download:'<path d="M12 4v11M7 11l5 5 5-5M5 20h14"/>',print:'<path d="M7 9V4h10v5M7 17H5v-6h14v6h-2M8 14h8v6H8z"/>',key:'<circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M16 7l3 3M14 9l2 2"/>',mail:'<rect x="3.5" y="5.5" width="17" height="13" rx="2.5"/><path d="M4 7.5l8 6 8-6"/>',logout:'<path d="M10 5H5v14h5M15 8l4 4-4 4M19 12H9"/>',refresh:'<path d="M20 11a8 8 0 00-14-4L4 9M4 4v5h5M4 13a8 8 0 0014 4l2-2M20 20v-5h-5"/>',file:'<path d="M6 3.5h8l4 4v13H6z"/><path d="M14 3.5v4h4"/>',info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',users:'<circle cx="9" cy="8.5" r="3"/><path d="M3 19.5c.7-3.2 3-4.8 6-4.8s5.3 1.6 6 4.8"/><circle cx="17" cy="9.5" r="2.4"/><path d="M17 14.5c2.2.2 3.6 1.6 4 4"/>',phone:'<rect x="7" y="3" width="10" height="18" rx="2.5"/><path d="M11 18h2"/>'};
const ic=n=>`<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">${ICON[n]||''}</svg>`;
const chip=(t,tone='gray')=>`<span class="chip ${tone}">${esc(t)}</span>`;
const stChip=s=>chip(STATUS_ID[s]||s,STATUS_TONE[s]||'gray');
const acChip=a=>{const [l,t]=ACCESS_LBL[a]||[a,'gray'];return chip(l,t)};
const cChip=s=>{const [l,t]=CONCERN_LBL[s]||[s,'gray'];return chip(l,t)};
const empty=(m,i='folder')=>`<div class="empty">${ic(i)}<p>${m}</p></div>`;
const banner=(t,tone='warn',i='alert')=>`<div class="ban ${tone}">${ic(i)}<div>${t}</div></div>`;
const card=(title,body,act='',pad=true)=>`<section class="card"><div class="ch"><h3>${title}</h3><div class="row">${act}</div></div><div class="${pad?'cb':''}">${body}</div></section>`;
const pageHead=(t,s,cta='',crumb='')=>`<div class="pg"><div>${crumb}<h1>${t}</h1>${s?`<p>${s}</p>`:''}</div><div class="row">${cta}</div></div>`;
const crumb=(...a)=>`<div class="crumb">${a.join(' / ')}</div>`;
const goLink=(v,a,t)=>`<a href="#${v}${a?'/'+a:''}" data-act="go" data-v="${v}" data-a="${a||''}">${t}</a>`;
const tabsBar=(items,cur,act)=>`<div class="tabs" role="tablist">${items.map(([k,l])=>`<button type="button" role="tab" aria-selected="${k===cur}" data-act="${act}" data-t="${k}">${l}</button>`).join('')}</div>`;
const projSel=()=>`<select class="in" style="width:auto;min-width:min(100%,300px)" aria-label="Pilih proyek" data-bind="ui.pid">${S.projects.map(p=>`<option value="${p.id}" ${p.id===ui.pid?'selected':''}>${p.id} — ${esc(p.title)}</option>`).join('')}</select>`;
const toggle=(bind,on,label,sub='')=>`<div class="tog"><div><div class="b">${label}</div>${sub?`<div class="sm muted">${sub}</div>`:''}</div><label class="sw"><input type="checkbox" data-bind="${bind}" ${on?'checked':''} aria-label="${esc(label)}"><i></i></label></div>`;

/* ---------- domain helpers ---------- */
const P=id=>S.projects.find(p=>p.id===id);
const role=()=>S.session&&S.session.role;
const isRes=()=>role()==='owner';
const can=a=>({admin:['create','cost','authorize','resolve','revise','exec','access','settings','manage','reports'],coord:['exec','access','resolve','tech'],owner:[]}[role()]||[]).includes(a);
const who=()=>({admin:'Sari Wulandari',coord:'Dimas Prakoso',owner:'Unit '+MY}[role()]);
const total=p=>p.costs.reduce((a,c)=>a+c.qty*c.price,0);
const benUnits=p=>p.units.filter(u=>u.k==='ben'||u.k==='both');
const accUnits=p=>p.units.filter(u=>u.k==='acc'||u.k==='both');
const disUnits=p=>p.units.filter(u=>u.k==='dis');
const uOf=(p,id)=>p.units.find(u=>u.id===id);
const activeP=()=>S.projects.filter(p=>!['Completed','Cancelled'].includes(p.status));
const unitsBy=st=>S.projects.flatMap(p=>p.units.filter(u=>u.access===st).map(u=>({p,u})));
const openC=()=>S.concerns.filter(c=>!['Resolved','Closed'].includes(c.status));
const stageOf=s=>STAGE_OF[s]==null?0:STAGE_OF[s];
function alloc(p,sc){
  const T=total(p),step=T%1000===0?1000:1,fund=Math.min(T,Math.round(T*sc.pct/100/step)*step),owner=T-fund,bu=benUnits(p);
  if(!bu.length)return{T,fund,owner,rows:[],unassigned:owner,sum:fund};
  const w=bu.map(u=>u.k==='both'?sc.acc:1),sw=w.reduce((a,b)=>a+b,0),raw=w.map(x=>owner*x/sw),base=raw.map(r=>Math.floor(r/step)*step);
  const rem=Math.round((owner-base.reduce((a,b)=>a+b,0))/step);
  raw.map((r,i)=>[r-base[i],i]).sort((a,b)=>b[0]-a[0]).slice(0,rem).forEach(([,i])=>base[i]+=step);
  return{T,fund,owner,rows:bu.map((u,i)=>({id:u.id,amt:base[i],w:w[i],acc:u.k==='both'})),unassigned:0,sum:fund+base.reduce((a,b)=>a+b,0)};
}
function pendingAction(p){
  const alt=p.units.filter(u=>u.access==='Alternative Requested').length,req=p.units.filter(u=>u.access==='Request Sent').length,acc=p.units.filter(u=>u.access==='Accepted').length,oc=S.concerns.filter(c=>c.pid===p.id&&!['Resolved','Closed'].includes(c.status)).length;
  if(p.status==='Paused')return 'Proyek dijeda';if(p.status==='Disputed')return 'Tinjau sengketa';
  if(alt)return `Tinjau ${alt} permintaan jadwal alternatif`;if(oc)return `Tanggapi ${oc} kekhawatiran`;if(acc)return `Konfirmasi ${acc} akses diterima`;if(req)return `Menunggu ${req} respons akses`;
  return {'Proposal Revision':'Selesaikan revisi usulan','Under Assessment':'Verifikasi penilaian teknis','Stakeholder Mapping':'Lengkapi pemetaan unit','Scheduled':'Siapkan pelaksanaan','In Progress':'Perbarui progres','Draft':'Lengkapi dan terbitkan','Awaiting Authorization':'Menunggu otorisasi','Completed':'—'}[p.status]||'Pantau respons';
}
function log(pid,who_,what,prev='—',next='—'){S.activity.unshift({t:now(),who:who_,what,prev,next,pid})}
function notify(to,cat,title,body,pid,why,action,deadline='—'){S.notes.unshift({id:'n'+(S.seq.n++),to,cat,title,body,pid,why,action,deadline,read:false,t:now()})}
function addDecision(pid,type,unit,by,ver,status,basis,note){S.decisions.unshift({id:'D-'+(S.seq.d++),pid,type,unit,by,ver,date:now().split(',')[0],status,basis:basis||'',note:note||''})}

/* ---------- roles & nav ---------- */
const NAV={
 admin:[['overview','Overview','home'],['projects','Repair Projects','wrench'],['impact','Impact & Stakeholders','map'],['cost','Cost Allocation','scale'],['access','Access & Schedule','cal'],['resolution','Resolution Center','chat'],['decisions','Decisions & Agreements','doc'],['exec','Work Execution','tool'],['reports','Reports & Analytics','chart'],'-',['buildings','Buildings & Units','building'],['docs','Documents','folder'],['notif','Notifications','bell'],['settings','Settings','gear']],
 coord:[['overview','Overview','home'],['projects','Repair Projects','wrench'],['impact','Impact & Stakeholders','map'],['access','Access & Schedule','cal'],['resolution','Resolution Center','chat'],['exec','Work Execution','tool'],'-',['docs','Documents','folder'],['notif','Notifications','bell']],
 owner:[['r-overview','My Overview','home'],['r-requests','Repair Requests','wrench'],['r-access','Access & Schedule','cal'],['r-proposals','Proposals','scale'],['r-docs','Documents','folder'],['notif','Notifications','bell'],['profile','My Profile','user']]
};
const defaultView=()=>isRes()?'r-overview':'overview';
const ALLOWED_EXTRA={admin:['project','wizard','concern'],coord:['project','concern'],owner:['r-request']};
function allowed(v){const r=role();return !!V[v]&&(NAV[r].some(n=>n[0]===v)||(ALLOWED_EXTRA[r]||[]).includes(v))}
const V={},A={},F={};
const unread=()=>S.notes.filter(n=>n.to===(isRes()?'res':'mgmt')&&!n.read).length;

/* ---------- router ---------- */
function applyHash(){const h=location.hash.replace(/^#\/?/,'');const parts=h?h.split('/'):[];ui.view=parts[0]||null;ui.args=parts.slice(1)}
function go(v,...a){ui.view=v;ui.args=a;ui.menu=null;ui.modal=null;ui.drawer=null;ui.nav=false;const h='#'+[v,...a].join('/');try{history.pushState(null,'',h)}catch(e){location.hash=h}scrollTo(0,0);render()}
addEventListener('popstate',()=>{applyHash();render()});

/* ---------- toast / modal ---------- */
let tt;
function toast(m){const t=$('#toast');t.textContent=m;t.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('show'),3600)}
function openModal(title,body,foot,wide){ui.modal={title,body,foot,wide}}
function openDrawer(title,body){ui.drawer={title,body}}
function confirmModal(title,text,actAttr,label='Ya, lanjutkan',danger=false){openModal(title,()=>`<p>${text}</p>`,()=>`<button class="btn o" data-act="closeM">Batal</button><button class="btn ${danger?'d':'p'}" ${actAttr}>${label}</button>`)}
function overlayHTML(){
  let h='';
  if(ui.drawer)h+=`<div class="dbg" data-bg="d"><div class="drawer" role="dialog" aria-modal="true" aria-label="${esc(ui.drawer.title)}"><div class="mh"><h3>${esc(ui.drawer.title)}</h3><button class="ib" data-act="closeD" aria-label="Tutup panel">${ic('x')}</button></div><div class="mb">${ui.drawer.body()}</div></div></div>`;
  if(ui.modal){const m=ui.modal;h+=`<div class="bg" data-bg="m"><div class="modal ${m.wide?'wide':''}" role="dialog" aria-modal="true" aria-label="${esc(m.title)}"><div class="mh"><h3>${esc(m.title)}</h3><button class="ib" data-act="closeM" aria-label="Tutup">${ic('x')}</button></div><div class="mb">${m.body()}</div>${m.foot?`<div class="mf">${m.foot()}</div>`:''}</div></div>`}
  return h;
}

/* ---------- render ---------- */
function render(){
  const ae=document.activeElement,fk=ae&&ae.dataset&&ae.dataset.fk,pos=ae&&ae.selectionStart;
  if(S.session&&(!ui.view||!allowed(ui.view)))ui.view=defaultView();
  $('#app').innerHTML=S.session?shell():loginView();
  $('#overlay').innerHTML=overlayHTML();
  document.body.style.overflow=(ui.modal||ui.drawer)?'hidden':'';
  if(fk){const el=$(`[data-fk="${fk}"]`);if(el){el.focus();try{el.setSelectionRange(pos,pos)}catch(e){}}}
  const t=S.session?(NAV[role()].find(n=>n[0]===ui.view)||[0,'Detail'])[1]:'Masuk';document.title=`${t} · REMBUK`;
}
function menuBtn(k,icon,label,badge,body,cls=''){return `<div class="menu-wrap"><button class="ib" data-act="menu" data-m="${k}" aria-label="${label}" aria-expanded="${ui.menu===k}">${ic(icon)}${badge?`<span class="dot">${badge}</span>`:''}</button>${ui.menu===k?`<div class="menu ${cls}" role="menu">${body}</div>`:''}</div>`}
function notifMenu(){const l=S.notes.filter(n=>n.to===(isRes()?'res':'mgmt')).slice(0,5);return `<div class="mi" style="cursor:default"><b>Notifikasi</b><button class="btn g sm" style="margin-left:auto" data-act="readAll">Tandai terbaca</button></div>`+(l.length?l.map(n=>`<button class="mi ${n.read?'':'un'}" data-act="openNote" data-id="${n.id}"><div><div class="b sm">${esc(n.title)}</div><div class="sm muted">${esc(n.body)}</div></div></button>`).join(''):`<div class="empty">Tidak ada notifikasi.</div>`)+`<button class="mi" data-act="go" data-v="notif" style="justify-content:center;color:var(--teal);font-weight:600">Lihat semua</button>`}
function userMenu(){const roles=[['admin','Building Management'],['owner','Unit Owner'],['coord','Maintenance Coordinator']].filter(r=>r[0]!==role());return `<div class="mi" style="cursor:default"><div><div class="b">${esc(S.session.name)}</div><div class="sm muted">${esc(S.session.label)}</div></div></div><div class="mi" style="cursor:default;display:block"><div class="sm muted" style="margin-bottom:6px">Ganti peran</div>${roles.map(r=>`<button class="btn o sm w" style="margin-bottom:6px" data-act="switchRole" data-r="${r[0]}">${r[1]}</button>`).join('')}</div><button class="mi" data-act="resetDemo">${ic('refresh')}<span>Reset data contoh</span></button><button class="mi" data-act="logout" style="border-bottom:0">${ic('logout')}<span>Keluar</span></button>`}
function helpBody(){return `<p class="muted" style="margin-bottom:12px">Ini prototipe dengan data fiktif Northpoint Residence. Semua tombol berfungsi dan perubahan tersimpan di browser Anda. Coba lima alur utama:</p><ol style="padding-left:18px;display:grid;gap:8px;margin:0"><li><b>A · Membuat perbaikan</b> — masuk sebagai Building Management, buka <i>Repair Projects → Buat Proyek</i>.</li><li><b>B · Warga menerima permintaan akses</b> — masuk sebagai Unit Owner, buka <i>Access & Schedule</i>, pilih jadwal alternatif. Lalu lihat statusnya berubah di dashboard manajemen.</li><li><b>C · Warga bertanya soal biaya</b> — Unit Owner → <i>Proposals</i> → "Saya punya pertanyaan". Manajemen menjawab di <i>Resolution Center</i>.</li><li><b>D · Menyelesaikan ketidaksepakatan</b> — Resolution Center → pilih kekhawatiran → usulkan alternatif / revisi skenario → selesaikan.</li><li><b>E · Eksekusi & penutupan</b> — <i>Work Execution</i> → selesaikan langkah, catat biaya aktual, tutup proyek.</li></ol>`}
function shell(){
  const r=role(),n=unread();
  if(isRes())return `<div class="res"><div class="app"><div><header class="rtop"><div class="row" style="gap:10px;flex-wrap:nowrap"><svg width="30" height="30" aria-hidden="true"><use href="#mark"/></svg><b style="color:var(--navy);font-size:17px">REMBUK</b></div><nav class="rlinks" aria-label="Navigasi">${NAV.owner.map(i=>`<button class="${ui.view===i[0]||(ui.view==='r-request'&&i[0]==='r-requests')?'on':''}" data-act="go" data-v="${i[0]}">${i[1]}</button>`).join('')}</nav><div class="row" style="flex-wrap:nowrap">${menuBtn('help','help','Bantuan',0,helpBody(),'')}${menuBtn('bell','bell','Notifikasi',n,notifMenu())}${`<div class="menu-wrap"><button class="av" data-act="menu" data-m="user" aria-label="Menu akun" aria-expanded="${ui.menu==='user'}">${esc(S.session.name[0])}</button>${ui.menu==='user'?`<div class="menu" role="menu">${userMenu()}</div>`:''}</div>`}</div></header><main class="main" id="main" tabindex="-1">${V[ui.view]()}</main></div><nav class="bnav" aria-label="Navigasi bawah">${[['r-overview','Beranda','home'],['r-requests','Perbaikan','wrench'],['r-access','Akses','cal'],['r-proposals','Usulan','scale'],['notif','Notifikasi','bell']].map(i=>`<button class="${ui.view===i[0]||(ui.view==='r-request'&&i[0]==='r-requests')?'on':''}" data-act="go" data-v="${i[0]}" aria-label="${i[1]}">${ic(i[2])}${i[1]}${i[0]==='notif'&&n?`<span class="dot">${n}</span>`:''}</button>`).join('')}</nav></div></div>`;
  const tw=['Semua Tower','Tower A','Tower B'];
  return `<div class="app"><aside class="side ${ui.nav?'open':''}" aria-label="Navigasi utama"><a class="logo" href="../" title="Kembali ke Company Profile" style="color:inherit;text-decoration:none"><svg aria-hidden="true"><use href="#mark"/></svg>REMBUK</a>${NAV[r].map(i=>i==='-'?'<div class="sep"></div>':`<button class="nv ${ui.view===i[0]||(ui.view==='project'&&i[0]==='projects')||(ui.view==='wizard'&&i[0]==='projects')||(ui.view==='concern'&&i[0]==='resolution')?'on':''}" data-act="go" data-v="${i[0]}">${ic(i[2])}${i[1]}${i[0]==='notif'&&n?`<span class="dot">${n}</span>`:''}</button>`).join('')}</aside><div class="mw"><header class="top"><button class="ib burger" data-act="nav" aria-label="Buka menu">${ic('menu')}</button><div class="menu-wrap"><button class="btn o sm" data-act="menu" data-m="build" aria-expanded="${ui.menu==='build'}">${ic('building')}<span>Northpoint Residence · ${esc(ui.towF||'Semua Tower')}</span>${ic('down')}</button>${ui.menu==='build'?`<div class="menu l">${tw.map(t=>`<button class="mi" data-act="tower" data-t="${t==='Semua Tower'?'':t}">${t}${(ui.towF||'Semua Tower')===t?' ✓':''}</button>`).join('')}</div>`:''}</div><div class="srch"><label class="sr" for="gs">Cari proyek</label>${ic('search')}<input id="gs" class="in" placeholder="Cari proyek, unit, atau ID…" value="${esc(ui.q)}" data-bind="ui.q" data-search="1" data-fk="gs"></div><div style="flex:1"></div><a class="btn o sm" href="../">${ic('left')}<span>Company Profile</span></a>${menuBtn('bell','bell','Notifikasi',n,notifMenu())}<button class="ib" data-act="help" aria-label="Bantuan">${ic('help')}</button><div class="menu-wrap"><button class="av" data-act="menu" data-m="user" aria-label="Menu akun" aria-expanded="${ui.menu==='user'}">${esc(S.session.name[0])}</button>${ui.menu==='user'?`<div class="menu" role="menu">${userMenu()}</div>`:''}</div></header><main class="main" id="main" tabindex="-1">${V[ui.view]()}</main></div></div>`;
}

/* ---------- login ---------- */
const ACCOUNTS={'admin@northpoint.id':['rembuk123','admin','Sari Wulandari','Administrator Gedung · Northpoint Property Management'],'alex@northpoint.id':['rembuk123','owner','Alex','Pemilik Unit A-08-03'],'teknisi@northpoint.id':['rembuk123','coord','Dimas Prakoso','Koordinator Pemeliharaan']};
const DEMO={admin:['admin@northpoint.id'],owner:['alex@northpoint.id'],coord:['teknisi@northpoint.id']};
function loginView(){
  const l=ui.login;
  return `<div class="login"><div class="lb"><div class="row" style="gap:12px"><svg width="44" height="44" aria-hidden="true"><use href="#mark"/></svg><b style="font-size:24px;letter-spacing:.03em">REMBUK</b></div><div><span class="chip blue" style="background:rgba(96,165,250,.15);color:#9cc6ff">Better Agreements. Shared Responsibility.</span><h2>Satu perbaikan. Banyak kepentingan. Satu kesepakatan yang transparan.</h2><p>Platform koordinasi perbaikan bersama untuk pengelola gedung: petakan dampak, bandingkan skenario biaya, atur akses, dan catat setiap keputusan.</p><svg class="hub" viewBox="0 0 340 200" width="100%" style="max-width:380px;margin-top:26px" aria-hidden="true"><defs><radialGradient id="hg"><stop offset="0" stop-color="#60A5FA" stop-opacity=".55"/><stop offset="1" stop-color="#60A5FA" stop-opacity="0"/></radialGradient></defs><circle cx="170" cy="100" r="70" fill="url(#hg)"/><circle class="hr" cx="170" cy="100" r="30" fill="none" stroke="#60A5FA"/><circle class="hr h2" cx="170" cy="100" r="30" fill="none" stroke="#60A5FA"/><path class="hl" d="M50 50Q170 100 170 100" fill="none" stroke="#318B83" stroke-width="1.6" stroke-linecap="round"/><path class="hl" d="M290 50Q170 100 170 100" fill="none" stroke="#E4A34A" stroke-width="1.6" stroke-linecap="round"/><path class="hl" d="M50 150Q170 100 170 100" fill="none" stroke="#2F6FED" stroke-width="1.6" stroke-linecap="round"/><path class="hl" d="M290 150Q170 100 170 100" fill="none" stroke="#7C8FD8" stroke-width="1.6" stroke-linecap="round"/><circle cx="170" cy="100" r="28" fill="#0f2a52" stroke="#60A5FA" stroke-width="1.5"/><path d="M158 100l8 8 16-17" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/><g class="hn" style="animation-delay:0.0s"><circle cx="50" cy="50" r="17" fill="#318B83" opacity=".22"/><circle cx="50" cy="50" r="11" fill="#318B83"/><text x="50" y="28" text-anchor="middle" fill="rgba(255,255,255,.8)" font-size="11" font-weight="600" font-family="Inter,sans-serif">Pemilik</text></g><g class="hn" style="animation-delay:0.5s"><circle cx="290" cy="50" r="17" fill="#E4A34A" opacity=".22"/><circle cx="290" cy="50" r="11" fill="#E4A34A"/><text x="290" y="28" text-anchor="middle" fill="rgba(255,255,255,.8)" font-size="11" font-weight="600" font-family="Inter,sans-serif">Penghuni</text></g><g class="hn" style="animation-delay:1.0s"><circle cx="50" cy="150" r="17" fill="#2F6FED" opacity=".22"/><circle cx="50" cy="150" r="11" fill="#2F6FED"/><text x="50" y="180" text-anchor="middle" fill="rgba(255,255,255,.8)" font-size="11" font-weight="600" font-family="Inter,sans-serif">Pengelola</text></g><g class="hn" style="animation-delay:1.5s"><circle cx="290" cy="150" r="17" fill="#7C8FD8" opacity=".22"/><circle cx="290" cy="150" r="11" fill="#7C8FD8"/><text x="290" y="180" text-anchor="middle" fill="rgba(255,255,255,.8)" font-size="11" font-weight="600" font-family="Inter,sans-serif">Vendor</text></g><text x="170" y="150" text-anchor="middle" fill="#9cc6ff" font-size="11" font-weight="700" letter-spacing=".08em" font-family="Inter,sans-serif">KESEPAKATAN</text></svg></div><p class="sm" style="color:rgba(255,255,255,.55)">${ic('shield')} Setiap keputusan tercatat, dapat ditelusuri, dan tidak pernah dipaksakan.</p></div>
  <div class="lf"><form data-form="login" novalidate><h1 style="font-size:28px">Welcome back</h1><p class="muted" style="margin:6px 0 22px">Sign in to continue managing shared building repairs and agreements.</p>
  ${l.err?`<div class="ban danger" style="margin-bottom:14px" role="alert">${ic('alert')}<div>${esc(l.err)}</div></div>`:''}${l.ok?`<div class="ban ok" style="margin-bottom:14px" role="status">${ic('check')}<div>Berhasil masuk. Mengalihkan…</div></div>`:''}
  <div class="fld"><label class="l" for="em">Email address</label><input id="em" class="in ${l.eE?'bad':''}" type="email" autocomplete="username" data-bind="ui.login.email" value="${esc(l.email)}" placeholder="nama@northpoint.id" aria-invalid="${!!l.eE}">${l.eE?`<div class="fe">${l.eE}</div>`:''}</div>
  <div class="fld"><label class="l" for="pw">Password</label><div class="pw"><input id="pw" class="in ${l.pE?'bad':''}" type="${l.show?'text':'password'}" autocomplete="current-password" data-bind="ui.login.pass" value="${esc(l.pass)}" aria-invalid="${!!l.pE}"><button type="button" data-act="showPw" aria-label="${l.show?'Sembunyikan':'Tampilkan'} kata sandi">${ic('eye')}</button></div>${l.pE?`<div class="fe">${l.pE}</div>`:''}</div>
  <div class="row between" style="margin-bottom:18px"><label class="row sm" style="gap:8px"><input type="checkbox" data-bind="ui.login.remember" ${l.remember?'checked':''}> Remember me</label><button type="button" class="btn g sm" data-act="forgot">Forgot password?</button></div>
  <button class="btn p w lg" type="submit" ${l.loading?'disabled':''}>${l.loading?'Memproses…':'Sign In'}</button>
  <div class="demo"><div class="sm b" style="margin-bottom:4px">Masuk cepat tanpa kata sandi</div><div class="sm muted" style="margin-bottom:10px">Pilih peran untuk melihat pengalaman yang berbeda.</div><div class="col" style="gap:8px"><button type="button" class="btn n" data-act="demo" data-r="admin">${ic('building')}Enter as Building Management</button><button type="button" class="btn o" data-act="demo" data-r="owner">${ic('key')}Enter as Unit Owner</button><button type="button" class="btn o" data-act="demo" data-r="coord">${ic('tool')}Enter as Maintenance Coordinator</button></div><div class="sm muted" style="margin-top:10px">Atau gunakan akun uji: <code>admin@northpoint.id</code> / <code>rembuk123</code></div></div>
  <p class="sm muted" style="margin-top:18px;text-align:center"><button type="button" class="btn g sm" data-act="info" data-t="Hubungi administrator">Contact administrator</button> · <button type="button" class="btn g sm" data-act="info" data-t="Kebijakan privasi">Privacy policy</button> · <button type="button" class="btn g sm" data-act="info" data-t="Ketentuan layanan">Terms of service</button></p><p class="sm" style="text-align:center;margin-top:6px"><a href="../">← Kembali ke situs REMBUK</a></p></form></div></div>`;
}
function setSession(r,email){const a=Object.values(ACCOUNTS).find(x=>x[1]===r);S.session={role:r,name:a[2],label:a[3]};save();ui.login={...ui.login,pass:'',err:'',eE:'',pE:'',loading:false,ok:false};go(defaultView())}
F.login=()=>{
  const l=ui.login;l.eE=l.pE=l.err='';
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(l.email.trim()))l.eE='Masukkan alamat email yang valid.';
  if(!l.pass)l.pE='Kata sandi wajib diisi.';
  if(l.eE||l.pE){render();return}
  l.loading=true;render();
  setTimeout(()=>{const a=ACCOUNTS[l.email.trim().toLowerCase()];l.loading=false;if(!a||a[0]!==l.pass){l.err='Email atau kata sandi tidak cocok. Periksa kembali atau gunakan tombol masuk cepat.';render();return}l.ok=true;render();setTimeout(()=>setSession(a[1]),600)},700);
};
A.showPw=()=>{ui.login.show=!ui.login.show};
A.forgot=()=>{openModal('Lupa kata sandi',()=>`<p>Masukkan email Anda; tautan pengaturan ulang akan dikirim (simulasi).</p><div class="fld" style="margin-top:12px"><label class="l" for="fe">Email</label><input id="fe" class="in" type="email" data-bind="ui.f.fe"></div>`,()=>`<button class="btn o" data-act="closeM">Batal</button><button class="btn p" data-act="forgotSend">Kirim tautan</button>`)};
A.forgotSend=()=>{ui.modal=null;toast('Jika email terdaftar, tautan pengaturan ulang akan dikirim (simulasi).')};
A.info=d=>{openModal(d.t,()=>`<p>${d.t==='Hubungi administrator'?'Hubungi administrator gedung Anda untuk mendapatkan akun REMBUK.':'Ini adalah halaman contoh pada prototipe ini. Dokumen resmi akan tersedia pada versi produksi.'}</p>`,()=>`<button class="btn p" data-act="closeM">Mengerti</button>`)};
A.demo=d=>{ui.login.email=DEMO[d.r][0];ui.login.ok=true;render();setTimeout(()=>setSession(d.r),350);return false};

/* ---------- core actions ---------- */
A.go=d=>{go(d.v,...(d.a?d.a.split('/'):[]));return false};
A.menu=d=>{ui.menu=ui.menu===d.m?null:d.m;ui.nav=false};
A.nav=()=>{ui.nav=!ui.nav};
A.help=()=>{openModal('Panduan aplikasi',helpBody,()=>`<button class="btn o" data-act="resetDemo">Reset data contoh</button><button class="btn p" data-act="closeM">Mulai</button>`,true)};
A.closeM=()=>{ui.modal=null;ui.f={}};A.closeD=()=>{ui.drawer=null};
A.logout=()=>{S.session=null;ui.menu=null;ui.view=null;try{history.pushState(null,'',location.pathname)}catch(e){}toast('Anda telah keluar.')};
A.switchRole=d=>{setSession(d.r);toast('Beralih peran: '+S.session.label);return false};
A.resetDemo=()=>{const s=S.session;S=seed();S.session=s;ui.modal=null;ui.menu=null;ui.wiz=null;ui.f={};save();toast('Data contoh dikembalikan ke kondisi awal.');go(defaultView());return false};
A.tower=d=>{ui.towF=d.t;ui.menu=null};
A.readAll=()=>{S.notes.forEach(n=>{if(n.to===(isRes()?'res':'mgmt'))n.read=true})};
A.openNote=d=>{const n=S.notes.find(x=>x.id===d.id);n.read=true;ui.menu=null;const to=isRes()?'r-requests':(n.cat==='New concern response'?'resolution':n.cat==='Schedule update'?'access':'projects');go(to);return false};
A.noop=()=>{};

/* ---------- events ---------- */
function setPath(path,val){const ks=path.split('.');let o=ks[0]==='S'?S:ui;for(let i=1;i<ks.length-1;i++)o=o[ks[i]];o[ks[ks.length-1]]=val}
const RERENDER=t=>t.tagName==='SELECT'||['checkbox','radio','date','time'].includes(t.type);
document.addEventListener('click',e=>{
  let need=false;
  if(ui.menu&&!e.target.closest('.menu-wrap')){ui.menu=null;need=true}
  const bg=e.target.dataset&&e.target.dataset.bg;
  if(bg==='m'){ui.modal=null;ui.f={};need=true}else if(bg==='d'){ui.drawer=null;need=true}
  const t=e.target.closest('[data-act]');
  if(t&&!t.disabled&&t.getAttribute('aria-disabled')!=='true'){
    const fn=A[t.dataset.act];
    if(fn){if(t.tagName==='A')e.preventDefault();const r=fn(t.dataset,t,e);if(r!==false)need=true;save()}
  }
  if(need)render();
});
document.addEventListener('input',e=>{
  const t=e.target;if(!t.dataset||!t.dataset.bind||t.type==='checkbox'||t.type==='radio'||t.type==='file')return;
  let v=t.value;if(t.dataset.num!==undefined){v=Number(v)||0;if(t.min!==''&&v<Number(t.min))v=Number(t.min)}
  setPath(t.dataset.bind,v);
  if(t.dataset.search){if(ui.view!=='projects'&&ui.view!=='r-requests'){go('projects')}else render();return}
  if(t.type==='range'||t.dataset.live!==undefined){save();render()}else save();
});
document.addEventListener('change',e=>{
  const t=e.target;
  if(t.type==='file'&&t.dataset.files){A.files&&A.files(t);return}
  if(!t.dataset||!t.dataset.bind)return;
  let v=t.type==='checkbox'?t.checked:t.value;if(t.dataset.num!==undefined)v=Number(v)||0;
  if(t.type==='radio'&&!t.checked)return;
  setPath(t.dataset.bind,v);save();if(RERENDER(t))render();
});
document.addEventListener('submit',e=>{const f=e.target.closest('[data-form]');if(f){e.preventDefault();F[f.dataset.form]&&F[f.dataset.form](f)}});
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){if(ui.modal||ui.drawer||ui.menu||ui.nav){ui.modal=ui.drawer=ui.menu=null;ui.nav=false;render()}}
  if((e.key==='Enter'||e.key===' ')&&e.target.matches&&e.target.matches('[data-act][tabindex]')&&e.target.tagName!=='BUTTON'){e.preventDefault();e.target.dispatchEvent(new MouseEvent('click',{bubbles:true}))}
});
function boot(){applyHash();render()}
