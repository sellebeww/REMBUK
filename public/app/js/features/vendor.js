'use strict';
/* Copyright (c) 2026 Vassel Goleyu. REMBUK demo: tampilan vendor.
   Prinsip privasi: vendor hanya melihat proyek yang ditugaskan, kode unit dan jadwal akses,
   pelaksanaan pekerjaan, dan dokumen berlabel vendor. Tidak ada kekhawatiran, keputusan, nama penghuni, atau pembagian biaya. */
const VENDOR_STEPS=[3,4,5,6]; // indeks EXEC_STEPS yang boleh dicentang vendor; selebihnya tugas pengelola
const vProjects=()=>S.projects.filter(p=>p.work&&p.work.vendor===myVendor()&&!['Cancelled'].includes(p.status));
const vCur=()=>{const l=vProjects();return l.find(p=>p.id===ui.vP)||l[0]};
const vSel=()=>{const l=vProjects();return l.length>1?`<select class="in" style="width:auto;min-width:min(100%,300px)" aria-label="Pilih proyek" data-bind="ui.vP">${l.map(p=>`<option value="${p.id}" ${vCur()&&p.id===vCur().id?'selected':''}>${p.id}: ${esc(p.title)}</option>`).join('')}</select>`:''};
const vNone=t=>pageHead(t,'')+card('Belum ada tugas',empty('Belum ada proyek yang ditugaskan kepada vendor Anda.','wrench'));
V['v-overview']=()=>{
  const l=vProjects();if(!l.length)return vNone('Proyek Saya');
  const due=RembukCore.dueItems(l.map(p=>({id:p.id,title:p.title,status:p.status,deadline:p.deadline,units:p.units})),S.notes.filter(n=>n.to==='vend').map(n=>({id:n.id,title:n.title,pid:n.pid,deadline:n.deadline,read:n.read})),todayStr());
  return pageHead('Proyek Saya','Proyek perbaikan yang ditugaskan kepada '+esc(myVendor())+'.')+
  `<div class="g3">${l.map(p=>`<article class="card"><div class="cb"><div class="row between"><b>${esc(p.title)}</b>${stChip(p.status)}</div><div class="sm muted">${p.id} · ${esc(p.loc)}</div><div class="sm" style="margin:10px 0 4px">Progres pekerjaan: ${p.work.done}/10 langkah</div><div class="cbar"><i class="f" style="width:${p.work.done*10}%"></i></div><div class="sm muted" style="margin-top:8px">Tenggat: ${fdate(p.deadline)}</div></div></article>`).join('')}</div><div style="height:16px"></div>`+
  card('Yang berbatas waktu',due.length?`<div class="col" style="gap:0">${due.map(d=>`<div class="row between" style="padding:12px 18px;border-bottom:1px solid var(--border)"><div>${esc(d.label)}</div>${chip(d.level==='overdue'?'Lewat '+Math.abs(d.days)+' hari':d.level==='today'?'Hari ini':d.days+' hari lagi',d.level==='overdue'?'danger':d.level==='soon'||d.level==='today'?'warn':'gray')}</div>`).join('')}</div>`:empty('Tidak ada tenggat dalam 14 hari.','cal'),'',false)+
  `<p class="sm muted" style="margin-top:12px">Anda hanya melihat proyek yang ditugaskan, jadwal akses berdasarkan kode unit, dan pelaksanaan pekerjaan. Data penghuni dan keuangan unit tidak ditampilkan.</p>`;
};
V['v-schedule']=()=>{
  const p=vCur();if(!p)return vNone('Jadwal Kerja');
  const us=accUnits(p).filter(u=>u.slot&&['Accepted','Confirmed','Request Sent','Alternative Requested'].includes(u.access));
  return pageHead('Jadwal Kerja','Jadwal akses per kode unit. Nama penghuni tidak ditampilkan.',vSel())+
  card(esc(p.title),us.length?`<div class="tw"><table class="t"><thead><tr><th>Unit</th><th>Tanggal</th><th>Jam</th><th>Perkiraan durasi</th><th>Status akses</th></tr></thead><tbody>${us.sort((a,b)=>(a.slot.d+a.slot.t).localeCompare(b.slot.d+b.slot.t)).map(u=>`<tr><td class="b">${u.id}</td><td class="nowrap">${fdate(u.slot.d)}</td><td class="nowrap">${u.slot.t}</td><td>${esc(u.dur||'-')}</td><td>${acChip(u.access)}</td></tr>`).join('')}</tbody></table></div>`:empty('Belum ada jadwal akses yang dikonfirmasi.','cal'),'',false)+
  `<p class="sm muted" style="margin-top:10px">Jadwal berstatus "Permintaan Terkirim" belum disetujui warga; jangan dianggap pasti.</p>`;
};
V['v-work']=()=>{
  const p=vCur();if(!p)return vNone('Pelaksanaan');
  const w=p.work,next=w.done<EXEC_STEPS.length?w.done:null,mine=next!=null&&VENDOR_STEPS.includes(next);
  ui.f.wnote=ui.f.wnote||'';
  return pageHead('Pelaksanaan','Catat progres pekerjaan Anda.',vSel())+
  card('Langkah pekerjaan',`<ol class="steps" style="list-style:none;margin:0;padding:0;display:grid;gap:8px">${EXEC_STEPS.map((s,k)=>`<li class="row between" style="padding:8px 0;border-bottom:1px solid var(--border)"><span>${k<w.done?ic('check'):'<span aria-hidden="true">○</span>'} ${s}</span>${k<w.done?chip('Selesai','ok'):k===w.done?(VENDOR_STEPS.includes(k)?chip('Giliran Anda','blue'):chip('Menunggu pengelola','gray')):chip('Belum','gray')}</li>`).join('')}</ol>${mine?`<button class="btn p" style="margin-top:14px" data-act="vStep" data-id="${p.id}">Tandai selesai: ${EXEC_STEPS[next]}</button>`:`<p class="sm muted" style="margin-top:14px">${next==null?'Semua langkah selesai.':'Langkah berikutnya dilakukan pengelola. Anda akan diberi tahu.'}</p>`}`)+
  `<div style="height:14px"></div>`+card('Catatan progres',`<div class="fld"><label class="l" for="vn">Catatan baru</label><textarea id="vn" class="in" data-bind="ui.f.wnote" placeholder="Apa yang sudah dikerjakan hari ini?">${esc(ui.f.wnote)}</textarea></div><button class="btn p" data-act="vNote" data-id="${p.id}">Tambah catatan</button>${w.notes.length?`<div class="col" style="margin-top:14px">${w.notes.map(n=>`<div style="border:1px solid var(--border);border-radius:12px;padding:12px"><div class="sm muted">${esc(n.by)} · ${n.t}</div>${esc(n.text)}</div>`).join('')}</div>`:''}`);
};
V['v-docs']=()=>{
  const p=vCur();if(!p)return vNone('Dokumen');
  const l=S.docs.filter(d=>d.pid===p.id&&(d.vis==='all'||d.vis==='vendor'));
  return pageHead('Dokumen','Dokumen yang dibagikan kepada vendor untuk proyek ini.',vSel())+card('Dokumen',l.length?`<div class="col" style="gap:0">${l.map(d=>`<div class="row between" style="padding:14px 18px;border-bottom:1px solid var(--border)"><div><div class="b">${ic('file')} ${esc(d.name)}</div><div class="sm muted">${d.cat} · ${d.date}</div></div><button class="btn o sm" data-act="docView" data-id="${d.id}">Lihat</button></div>`).join('')}</div>`:empty('Belum ada dokumen.','folder'),'',false);
};
A.vStep=d=>{const p=P(d.id);if(!p||p.work.vendor!==myVendor()||!VENDOR_STEPS.includes(p.work.done)){toast('Langkah ini dilakukan pengelola.');return false}
  const k=p.work.done;p.work.done++;log(p.id,myVendor(),'Langkah pekerjaan selesai: '+EXEC_STEPS[k],'—','Selesai');touch(p);
  if(k===3){setStatus(p,'In Progress');notify('res','Work progress','Pekerjaan dimulai: '+p.title,'Pekerjaan telah dimulai sesuai jadwal.',p.id,'Unit Anda terlibat dalam proyek ini.','Tidak ada tindakan')}
  notify('mgmt','Work progress','Vendor menyelesaikan: '+EXEC_STEPS[k],p.title,p.id,'Anda pengelola proyek ini.','Tinjau progres');
  toast('Langkah selesai: '+EXEC_STEPS[k])};
A.vNote=d=>{const p=P(d.id),t=(ui.f.wnote||'').trim();if(!p||p.work.vendor!==myVendor())return false;if(!t){toast('Tulis catatan terlebih dahulu.');return false}
  p.work.notes.unshift({text:t,by:myVendor(),t:now()});log(p.id,myVendor(),'Menambah catatan progres','—',t.slice(0,40));ui.f.wnote='';toast('Catatan progres ditambahkan.')};
