// Copyright (c) 2026 Vassel Goleyu. All rights reserved.
// Tes kebijakan RLS pada Postgres sungguhan (PGlite, WASM). Setiap peran hanya boleh melihat yang berhak.
import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const root = join(__dirname, '..');
const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const U = { mgr: id(1), alex: id(2), maya: id(3), citra: id(4), dewi: id(5), vend: id(6), vend2: id(7), mgr2: id(8) };
const B1 = id(100), B2 = id(101);
const unit = { u03: id(200), u04: id(201), u05: id(202), u09: id(203), x01: id(204) };
const V1 = id(300), V2 = id(301);
const P1 = id(400), P2 = id(401), P3 = id(402);

let db: PGlite;

/** Jalankan sebagai pengguna terautentikasi (peran authenticated + klaim sub). */
async function as<T>(user: string, fn: () => Promise<T>): Promise<T> {
  await db.exec(`set role authenticated; select set_config('request.jwt.claim.sub', '${user}', false);`);
  try { return await fn(); } finally { await db.exec(`reset role; select set_config('request.jwt.claim.sub', '', false);`); }
}
const rows = async (user: string, sql: string) => as(user, async () => (await db.query<Record<string, unknown>>(sql)).rows);
const col = async (user: string, sql: string, c: string) => (await rows(user, sql)).map((r) => r[c]).sort();

beforeAll(async () => {
  db = new PGlite();
  await db.exec(readFileSync(join(root, 'tests/bootstrap.sql'), 'utf8'));
  await db.exec(readFileSync(join(root, 'migrations/20261112000000_init.sql'), 'utf8'));
  const users = Object.entries(U).map(([k, v]) => `('${v}','${k}@x.test')`).join(',');
  await db.exec(`
    insert into auth.users values ${users};
    insert into profiles values ('${U.mgr}','Sari (pengelola)'),('${U.alex}','Alex'),('${U.maya}','Maya'),('${U.citra}','Citra'),('${U.dewi}','Dewi'),('${U.vend}','Teknisi Tirta'),('${U.mgr2}','Pengelola Gedung 2');
    insert into buildings values ('${B1}','Northpoint (demo)',now()),('${B2}','Gedung Lain (demo)',now());
    insert into units (id,building_id,code) values ('${unit.u03}','${B1}','A-08-03'),('${unit.u04}','${B1}','A-08-04'),('${unit.u05}','${B1}','A-08-05'),('${unit.u09}','${B1}','A-08-09'),('${unit.x01}','${B2}','Z-01-01');
    insert into vendors values ('${V1}','${B1}','PT Tirta Mandiri'),('${V2}','${B1}','CV Lain');
    insert into memberships (building_id,user_id,role,unit_id,vendor_id) values
      ('${B1}','${U.mgr}','manager',null,null),('${B1}','${U.alex}','owner','${unit.u03}',null),('${B1}','${U.maya}','resident','${unit.u04}',null),
      ('${B1}','${U.citra}','owner','${unit.u05}',null),('${B1}','${U.dewi}','owner','${unit.u09}',null),
      ('${B1}','${U.vend}','vendor',null,'${V1}'),('${B1}','${U.vend2}','vendor',null,'${V2}'),('${B2}','${U.mgr2}','manager',null,null);
    insert into projects (id,building_id,code,title,status,stage,vendor_id,deadline) values
      ('${P1}','${B1}','RMB-1','Pipa bersama','Awaiting Feedback',3,'${V1}','2026-11-20'),
      ('${P2}','${B1}','RMB-2','Draf internal','Draft',0,null,null),
      ('${P3}','${B2}','RMB-9','Proyek gedung lain','Awaiting Feedback',3,null,null);
    insert into project_units values
      ('${P1}','${unit.u03}','both','Request Sent','2026-11-14','09:00','2 jam'),('${P1}','${unit.u04}','both','Accepted','2026-11-14','13:00','3 jam'),('${P1}','${unit.u05}','ben','Not Requested',null,null,null),
      ('${P2}','${unit.u03}','ben','Not Requested',null,null,null);
    insert into cost_lines (project_id,description,qty,unit_price) values ('${P1}','Material',1,7000000),('${P1}','Tenaga kerja',1,5500000);
    insert into scenarios (project_id,key,fund_pct,status,policy) values ('${P1}','A',70,'Under Review','x'),('${P1}','B',40,'Published for Feedback','y');
    insert into documents (project_id,name,visibility) values ('${P1}','Laporan inspeksi','all'),('${P1}','Penawaran vendor','mgmt'),('${P1}','Instruksi lapangan','vendor');
  `);
  await db.exec(`insert into concerns (id,project_id,unit_id,category,description,raised_by) values ('${id(500)}','${P1}','${unit.u04}','Jadwal','Saya kerja pagi','${U.maya}')`);
  await db.exec(`insert into decisions (project_id,unit_id,type,by_user,note) values ('${P1}','${unit.u05}','Dukungan perbaikan','${U.citra}','Mendukung')`);
});
afterAll(async () => { await db.close(); });

describe('proyek: siapa melihat apa', () => {
  it('pengelola melihat semua proyek gedungnya, tidak gedung lain', async () => {
    expect(await col(U.mgr, 'select code from projects', 'code')).toEqual(['RMB-1', 'RMB-2']);
    expect(await col(U.mgr2, 'select code from projects', 'code')).toEqual(['RMB-9']);
  });
  it('pemilik/penghuni hanya proyek yang melibatkan unitnya, dan bukan Draft', async () => {
    expect(await col(U.alex, 'select code from projects', 'code')).toEqual(['RMB-1']); // RMB-2 draf disembunyikan
    expect(await col(U.maya, 'select code from projects', 'code')).toEqual(['RMB-1']);
    expect(await col(U.dewi, 'select code from projects', 'code')).toEqual([]); // unit tidak terlibat
  });
  it('vendor hanya proyek yang ditugaskan kepadanya', async () => {
    expect(await col(U.vend, 'select code from projects', 'code')).toEqual(['RMB-1']);
    expect(await col(U.vend2, 'select code from projects', 'code')).toEqual([]);
  });
  it('hanya pengelola yang dapat membuat atau mengubah proyek', async () => {
    await expect(as(U.alex, () => db.query(`insert into projects (building_id,code,title) values ('${B1}','X','x')`))).rejects.toThrow(/row-level security/);
    const r = await as(U.maya, () => db.query(`update projects set title='ubah' where id='${P1}' returning id`));
    expect(r.rows).toHaveLength(0);
    const ok = await as(U.mgr, () => db.query(`update projects set deadline='2026-11-22' where id='${P1}' returning id`));
    expect(ok.rows).toHaveLength(1);
    await expect(as(U.mgr2, () => db.query(`insert into projects (building_id,code,title) values ('${B1}','Y','y')`))).rejects.toThrow(/row-level security/);
  });
});

describe('privasi antar unit', () => {
  it('warga hanya melihat baris project_units miliknya', async () => {
    expect(await col(U.alex, 'select unit_id from project_units', 'unit_id')).toEqual([unit.u03]);
    expect(await col(U.citra, 'select unit_id from project_units', 'unit_id')).toEqual([unit.u05]);
  });
  it('vendor tidak dapat membaca project_units, concerns, decisions, atau memberships orang lain', async () => {
    expect(await rows(U.vend, 'select * from project_units')).toHaveLength(0);
    expect(await rows(U.vend, 'select * from concerns')).toHaveLength(0);
    expect(await rows(U.vend, 'select * from decisions')).toHaveLength(0);
    expect(await col(U.vend, 'select user_id from memberships', 'user_id')).toEqual([U.vend]);
  });
  it('kekhawatiran hanya terlihat oleh unit pengaju dan pengelola', async () => {
    expect(await rows(U.maya, 'select id from concerns')).toHaveLength(1);
    expect(await rows(U.mgr, 'select id from concerns')).toHaveLength(1);
    expect(await rows(U.alex, 'select id from concerns')).toHaveLength(0);
    expect(await rows(U.citra, 'select id from concerns')).toHaveLength(0);
  });
  it('keputusan unit lain tidak terlihat', async () => {
    expect(await rows(U.citra, 'select id from decisions')).toHaveLength(1);
    expect(await rows(U.alex, 'select id from decisions')).toHaveLength(0);
  });
  it('profil orang lain tidak terbaca oleh warga; pengelola membaca profil anggota gedungnya', async () => {
    expect(await col(U.alex, 'select id from profiles', 'id')).toEqual([U.alex]);
    expect((await rows(U.mgr, 'select id from profiles')).length).toBe(7 - 1); // tanpa pengelola gedung 2
  });
});

describe('biaya dan skenario', () => {
  it('pemilik dan vendor melihat rincian biaya; penghuni dan non-pihak tidak', async () => {
    expect(await rows(U.alex, 'select * from cost_lines')).toHaveLength(2);
    expect(await rows(U.vend, 'select * from cost_lines')).toHaveLength(2);
    expect(await rows(U.maya, 'select * from cost_lines')).toHaveLength(0);
    expect(await rows(U.dewi, 'select * from cost_lines')).toHaveLength(0);
    expect(await rows(U.vend2, 'select * from cost_lines')).toHaveLength(0);
  });
  it('pihak proyek hanya melihat skenario yang diterbitkan; vendor tidak melihat skenario', async () => {
    expect(await col(U.alex, 'select key from scenarios', 'key')).toEqual(['B']);
    expect(await col(U.mgr, 'select key from scenarios', 'key')).toEqual(['A', 'B']);
    expect(await rows(U.vend, 'select * from scenarios')).toHaveLength(0);
  });
  it('persentase di luar 0..100 ditolak oleh basis data', async () => {
    await expect(as(U.mgr, () => db.query(`update scenarios set fund_pct = 120 where project_id='${P1}' and key='A'`))).rejects.toThrow(/check constraint/);
  });
});

describe('dokumen', () => {
  it('visibilitas dokumen per peran', async () => {
    expect(await col(U.mgr, 'select name from documents', 'name')).toEqual(['Instruksi lapangan', 'Laporan inspeksi', 'Penawaran vendor']);
    expect(await col(U.alex, 'select name from documents', 'name')).toEqual(['Laporan inspeksi']);
    expect(await col(U.vend, 'select name from documents', 'name')).toEqual(['Instruksi lapangan', 'Laporan inspeksi']);
    expect(await rows(U.dewi, 'select name from documents')).toHaveLength(0);
  });
});

describe('tindakan warga', () => {
  it('warga mengajukan kekhawatiran hanya untuk unit dan proyeknya sendiri, atas namanya sendiri', async () => {
    await as(U.alex, () => db.query(`insert into concerns (project_id,unit_id,category,description,raised_by) values ('${P1}','${unit.u03}','Akses','pertanyaan','${U.alex}')`));
    await expect(as(U.alex, () => db.query(`insert into concerns (project_id,unit_id,category,description,raised_by) values ('${P1}','${unit.u04}','Akses','x','${U.alex}')`))).rejects.toThrow(/row-level security/);
    await expect(as(U.alex, () => db.query(`insert into concerns (project_id,unit_id,category,description,raised_by) values ('${P1}','${unit.u03}','Akses','x','${U.maya}')`))).rejects.toThrow(/row-level security/);
    await expect(as(U.dewi, () => db.query(`insert into concerns (project_id,unit_id,category,description,raised_by) values ('${P1}','${unit.u09}','Akses','x','${U.dewi}')`))).rejects.toThrow(/row-level security/);
  });
  it('warga tidak dapat mengubah status kekhawatiran; pengelola dapat', async () => {
    const r = await as(U.maya, () => db.query(`update concerns set status='Resolved' where id='${id(500)}' returning id`));
    expect(r.rows).toHaveLength(0);
    const ok = await as(U.mgr, () => db.query(`update concerns set status='Under Review' where id='${id(500)}' returning id`));
    expect(ok.rows).toHaveLength(1);
  });
  it('respons akses lewat fungsi: hanya unit sendiri, hanya status yang diizinkan', async () => {
    await as(U.alex, () => db.query(`select respond_access('${P1}','${unit.u03}','Alternative Requested')`));
    expect(await col(U.alex, 'select access_status from project_units', 'access_status')).toEqual(['Alternative Requested']);
    await expect(as(U.alex, () => db.query(`select respond_access('${P1}','${unit.u04}','Accepted')`))).rejects.toThrow(/bukan unit Anda/);
    await expect(as(U.alex, () => db.query(`select respond_access('${P1}','${unit.u03}','Confirmed')`))).rejects.toThrow(/status tidak diizinkan/);
    await expect(as(U.citra, () => db.query(`select respond_access('${P1}','${unit.u05}','Accepted')`))).rejects.toThrow(/tidak diminta akses/);
  });
  it('warga tidak dapat mengubah project_units langsung', async () => {
    const r = await as(U.alex, () => db.query(`update project_units set access_status='Confirmed' where unit_id='${unit.u03}' returning unit_id`));
    expect(r.rows).toHaveLength(0);
  });
  it('respons keuangan hanya oleh pemilik; penghuni ditolak; tidak dapat mengatasnamakan orang lain', async () => {
    await as(U.alex, () => db.query(`insert into decisions (project_id,unit_id,type,by_user) values ('${P1}','${unit.u03}','Respons usulan finansial','${U.alex}')`));
    await expect(as(U.maya, () => db.query(`insert into decisions (project_id,unit_id,type,by_user) values ('${P1}','${unit.u04}','Respons usulan finansial','${U.maya}')`))).rejects.toThrow(/row-level security/);
    await expect(as(U.alex, () => db.query(`insert into decisions (project_id,unit_id,type,by_user) values ('${P1}','${unit.u03}','Dukungan perbaikan','${U.maya}')`))).rejects.toThrow(/row-level security/);
    await expect(as(U.alex, () => db.query(`insert into decisions (project_id,unit_id,type,by_user) values ('${P1}','${unit.u03}','Otorisasi manajemen','${U.alex}')`))).rejects.toThrow(/row-level security/);
    await as(U.maya, () => db.query(`insert into decisions (project_id,unit_id,type,by_user) values ('${P1}','${unit.u04}','Dukungan perbaikan','${U.maya}')`));
  });
  it('pesan: warga hanya pada utasnya sebagai bukan-staf; pengelola sebagai staf', async () => {
    await as(U.maya, () => db.query(`insert into concern_messages (concern_id,author,from_staff,body) values ('${id(500)}','${U.maya}',false,'halo')`));
    await expect(as(U.maya, () => db.query(`insert into concern_messages (concern_id,author,from_staff,body) values ('${id(500)}','${U.maya}',true,'pura-pura staf')`))).rejects.toThrow(/row-level security/);
    await expect(as(U.alex, () => db.query(`insert into concern_messages (concern_id,author,from_staff,body) values ('${id(500)}','${U.alex}',false,'nyelonong')`))).rejects.toThrow(/row-level security/);
    await as(U.mgr, () => db.query(`insert into concern_messages (concern_id,author,from_staff,body) values ('${id(500)}','${U.mgr}',true,'terima kasih')`));
    expect(await rows(U.alex, 'select * from concern_messages')).toHaveLength(0);
  });
});

describe('vendor', () => {
  it('jadwal kerja hanya kode unit untuk akses yang sudah diterima/dikonfirmasi, tanpa identitas', async () => {
    const r = await rows(U.vend, `select * from vendor_schedule('${P1}')`);
    expect(r.map((x) => x.unit_code)).toEqual(['A-08-04']); // A-08-03 belum diterima
    expect(Object.keys(r[0] ?? {}).sort()).toEqual(['access_status', 'duration', 'slot_date', 'slot_time', 'unit_code']);
    expect(await rows(U.vend2, `select * from vendor_schedule('${P1}')`)).toHaveLength(0);
    expect(await rows(U.alex, `select * from vendor_schedule('${P1}')`)).toHaveLength(0);
  });
  it('vendor hanya mencatat langkah 3 sampai 6 atas namanya', async () => {
    await as(U.vend, () => db.query(`insert into work_steps (project_id,step,done_by) values ('${P1}',3,'${U.vend}')`));
    await expect(as(U.vend, () => db.query(`insert into work_steps (project_id,step,done_by) values ('${P1}',8,'${U.vend}')`))).rejects.toThrow(/row-level security/);
    await expect(as(U.vend2, () => db.query(`insert into work_steps (project_id,step,done_by) values ('${P1}',4,'${U.vend2}')`))).rejects.toThrow(/row-level security/);
    await expect(as(U.alex, () => db.query(`insert into work_steps (project_id,step,done_by) values ('${P1}',4,'${U.alex}')`))).rejects.toThrow(/row-level security/);
  });
  it('ringkasan agregat tersedia bagi pihak proyek, kosong bagi orang luar', async () => {
    const r = await rows(U.alex, `select * from project_summary('${P1}')`);
    expect(r[0]).toMatchObject({ beneficiaries: 3, access: 2, disturbed: 0, total: 3 });
    expect(((await rows(U.dewi, `select * from project_summary('${P1}')`))[0] as { total: number }).total).toBe(0);
  });
});

describe('log kejadian append-only', () => {
  it('klien tidak dapat INSERT, UPDATE, DELETE, atau TRUNCATE log', async () => {
    for (const sql of [
      `insert into event_log (building_id,action) values ('${B1}','palsu')`,
      `update event_log set action='x'`, `delete from event_log`, `truncate event_log`,
    ]) await expect(as(U.mgr, () => db.query(sql))).rejects.toThrow(/permission denied/);
  });
  it('bahkan pemilik tabel tidak dapat mengubah/menghapus diam-diam (pemicu)', async () => {
    await expect(db.exec(`update event_log set action='x'`)).rejects.toThrow(/append-only/);
    await expect(db.exec(`delete from event_log`)).rejects.toThrow(/append-only/);
    await expect(db.exec(`update decisions set note='x'`)).rejects.toThrow(/append-only/);
    await db.exec(`insert into scenario_revisions (project_id,key,version,prev_pct,next_pct,reason,by_user) values ('${P1}','B',2,40,50,'alasan','${U.mgr}')`);
    await expect(db.exec(`delete from scenario_revisions`)).rejects.toThrow(/append-only/);
    await expect(db.exec(`update concern_messages set body='x'`)).rejects.toThrow(/append-only/);
  });
  it('aksi nyata tercatat otomatis dan rantai hash utuh', async () => {
    await as(U.mgr, () => db.query(`update projects set status='Scheduled' where id='${P1}'`));
    const log = await rows(U.mgr, `select action from event_log where building_id='${B1}' order by id`);
    expect(log.map((l) => l.action)).toContain('Status proyek diubah');
    const v = await as(U.mgr, () => db.query<{ v: bigint | null }>(`select verify_event_chain('${B1}') as v`));
    expect(v.rows[0]?.v).toBeNull();
  });
  it('perubahan manual di luar aplikasi terdeteksi oleh verifikasi rantai', async () => {
    await db.exec(`alter table event_log disable trigger event_log_append_only; update event_log set action='DIUBAH' where id = (select min(id) from event_log where building_id='${B1}'); alter table event_log enable trigger event_log_append_only;`);
    const v = await as(U.mgr, () => db.query<{ v: bigint | null }>(`select verify_event_chain('${B1}') as v`));
    expect(v.rows[0]?.v).not.toBeNull();
    await expect(as(U.alex, () => db.query(`select verify_event_chain('${B1}')`))).rejects.toThrow(/hanya pengelola/);
  });
  it('siapa melihat log: pengelola semua; pihak proyek hanya yang bertanda parties; pelaku melihat miliknya', async () => {
    const mgr = await rows(U.mgr, `select * from event_log where building_id='${B1}'`);
    const citra = await rows(U.citra, 'select visibility, actor from event_log');
    expect(mgr.length).toBeGreaterThan(citra.length);
    expect(citra.every((r) => r.visibility === 'parties' || r.actor === U.citra)).toBe(true);
    expect(await rows(U.dewi, 'select * from event_log')).toHaveLength(0);
    expect(await rows(U.mgr2, `select * from event_log where building_id='${B1}'`)).toHaveLength(0);
  });
});

describe('preferensi pengingat', () => {
  it('hanya milik sendiri', async () => {
    await as(U.alex, () => db.query(`insert into reminder_prefs (user_id,browser_notifications) values ('${U.alex}', true)`));
    await expect(as(U.alex, () => db.query(`insert into reminder_prefs (user_id) values ('${U.maya}')`))).rejects.toThrow(/row-level security/);
    expect(await rows(U.maya, 'select * from reminder_prefs')).toHaveLength(0);
  });
});

describe('keanggotaan', () => {
  it('warga tidak dapat menambah dirinya sebagai pengelola', async () => {
    await expect(as(U.alex, () => db.query(`insert into memberships (building_id,user_id,role) values ('${B1}','${U.alex}','manager')`))).rejects.toThrow(/row-level security/);
  });
  it('constraint peran: pemilik wajib punya unit; vendor wajib punya vendor', async () => {
    await expect(db.exec(`insert into memberships (building_id,user_id,role) values ('${B1}','${U.dewi}','owner')`)).rejects.toThrow(/check constraint/);
    await expect(db.exec(`insert into memberships (building_id,user_id,role) values ('${B1}','${U.dewi}','vendor')`)).rejects.toThrow(/check constraint/);
  });
});
