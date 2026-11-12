'use strict';
/* Copyright (c) 2026 Vassel Goleyu. REMBUK: mode Supabase (pratinjau baca-saja).
   Login lewat Supabase Auth, peran dibaca dari tabel memberships, data dimuat lewat RembukCore.loadRemoteState (difilter RLS di server).
   Belum diuji terhadap instance Supabase nyata; diuji dengan klien palsu di E2E. Mode demo tidak memakai berkas ini. */
let REMOTE=null;
const ROLE_UI={manager:'admin',owner:'owner',resident:'resident',vendor:'vendor'};
async function remoteLoad(user){
  const mem=await REMOTE.from('memberships').select('*');
  if(mem.error||!mem.data||!mem.data.length)throw new Error('Akun ini belum menjadi anggota gedung mana pun. Hubungi pengelola.');
  const m=mem.data.find(x=>x.role==='manager')||mem.data[0];
  const prof=await REMOTE.from('profiles').select('*');
  const me=(prof.data||[]).find(p=>p.id===user.id);
  const st=await RembukCore.loadRemoteState(REMOTE);
  const units=await REMOTE.from('units').select('*');
  const unitCode=(units.data||[]).find(u=>u.id===m.unit_id);
  const vend=m.vendor_id?(await REMOTE.from('vendors').select('*')).data.find(v=>v.id===m.vendor_id):null;
  const base=seed();
  S={...base,session:{role:ROLE_UI[m.role],name:(me&&me.display_name)||user.email,label:m.role+' (Supabase)',vendor:vend?vend.name:undefined},projects:st.projects,concerns:st.concerns,decisions:st.decisions,docs:st.docs,notes:[],events:[],users:[],rhist:[]};
  S.projects.forEach(p=>{p.work.vendor=''});
  if(vend)S.projects.forEach(p=>{p.work.vendor=vend.name});
  if(unitCode)MY=unitCode.code;
  window.REMOTE_MODE=true;
  ui.view=null;go(defaultView());
}
window.remoteBoot=async function(){
  try{
    const c=window.REMBUK_CONFIG;
    REMOTE=RembukSupabase.createClient(c.supabaseUrl,c.supabaseAnonKey);
    const {data}=await REMOTE.auth.getSession();
    if(data&&data.session)await remoteLoad(data.session.user);
  }catch(e){ui.login.err=String(e.message||e);render()}
};
/* Ganti login demo dengan Supabase Auth. Tombol masuk cepat disembunyikan pada mode ini. */
F.login=async()=>{
  const l=ui.login;l.eE=l.pE=l.err='';
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(l.email.trim()))l.eE='Masukkan alamat email yang valid.';
  if(!l.pass)l.pE='Kata sandi wajib diisi.';
  if(l.eE||l.pE){render();return}
  l.loading=true;render();
  try{
    if(!REMOTE)REMOTE=RembukSupabase.createClient(window.REMBUK_CONFIG.supabaseUrl,window.REMBUK_CONFIG.supabaseAnonKey);
    const r=await REMOTE.auth.signInWithPassword({email:l.email.trim(),password:l.pass});
    if(r.error)throw new Error('Email atau kata sandi tidak cocok.');
    l.pass='';l.loading=false;await remoteLoad(r.data.user);
  }catch(e){l.loading=false;l.err=String(e.message||e);render()}
};
const _logout=A.logout;
A.logout=()=>{if(window.REMOTE_MODE&&REMOTE)REMOTE.auth.signOut();window.REMOTE_MODE=false;S=seed();_logout()};
