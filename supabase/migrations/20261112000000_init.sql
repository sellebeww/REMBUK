-- Copyright (c) 2026 Vassel Goleyu. All rights reserved.
-- REMBUK: skema multi-pihak dengan Row Level Security.
-- Prasyarat Supabase: skema auth (auth.users, auth.uid()) dan peran authenticated.
-- Prinsip: peran dibaca dari tabel memberships, bukan dari klaim JWT yang dapat dimanipulasi klien.

create type public.member_role as enum ('manager', 'owner', 'resident', 'vendor');
create type public.unit_kind as enum ('ben', 'acc', 'both', 'dis');

create table public.buildings (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table public.units (
  id uuid primary key default gen_random_uuid(),
  building_id uuid not null references public.buildings on delete cascade,
  code text not null,
  tower text,
  floor int,
  unique (building_id, code)
);

create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text not null,
  created_at timestamptz not null default now()
);

create table public.vendors (
  id uuid primary key default gen_random_uuid(),
  building_id uuid not null references public.buildings on delete cascade,
  name text not null
);

create table public.memberships (
  id uuid primary key default gen_random_uuid(),
  building_id uuid not null references public.buildings on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  role public.member_role not null,
  unit_id uuid references public.units on delete cascade,
  vendor_id uuid references public.vendors on delete cascade,
  created_at timestamptz not null default now(),
  check (
    (role in ('owner', 'resident') and unit_id is not null and vendor_id is null)
    or (role = 'vendor' and vendor_id is not null and unit_id is null)
    or (role = 'manager' and unit_id is null and vendor_id is null)
  )
);
create unique index memberships_unique on public.memberships (building_id, user_id, role, coalesce(unit_id, vendor_id, '00000000-0000-0000-0000-000000000000'::uuid));
create index memberships_user on public.memberships (user_id);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  building_id uuid not null references public.buildings on delete cascade,
  code text not null,
  title text not null,
  category text,
  tower text,
  priority text not null default 'Normal',
  status text not null default 'Draft',
  stage int not null default 0 check (stage between 0 and 6),
  deadline date,
  summary text,
  published_scenario char(1) check (published_scenario in ('A', 'B', 'C')),
  vendor_id uuid references public.vendors on delete set null,
  created_by uuid references auth.users,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (building_id, code)
);

create table public.project_units (
  project_id uuid not null references public.projects on delete cascade,
  unit_id uuid not null references public.units on delete cascade,
  kind public.unit_kind not null,
  access_status text not null default 'Not Requested',
  slot_date date,
  slot_time text,
  duration text,
  primary key (project_id, unit_id)
);
create index project_units_unit on public.project_units (unit_id);

create table public.cost_lines (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects on delete cascade,
  description text not null,
  qty numeric not null default 1 check (qty >= 0),
  unit_price bigint not null default 0 check (unit_price >= 0),
  category text,
  has_quote boolean not null default false
);

create table public.scenarios (
  project_id uuid not null references public.projects on delete cascade,
  key char(1) not null check (key in ('A', 'B', 'C')),
  fund_pct numeric not null default 0 check (fund_pct between 0 and 100),
  access_weight numeric not null default 1 check (access_weight >= 0),
  status text not null default 'Draft',
  version int not null default 1,
  policy text,
  primary key (project_id, key)
);

create table public.scenario_revisions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects on delete cascade,
  key char(1) not null,
  version int not null,
  prev_pct numeric not null,
  next_pct numeric not null,
  reason text not null check (length(btrim(reason)) > 0),
  by_user uuid references auth.users,
  created_at timestamptz not null default now()
);

create table public.concerns (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects on delete cascade,
  unit_id uuid not null references public.units on delete cascade,
  category text not null,
  item text,
  description text not null,
  status text not null default 'New',
  raised_by uuid not null references auth.users,
  created_at timestamptz not null default now()
);

create table public.concern_messages (
  id uuid primary key default gen_random_uuid(),
  concern_id uuid not null references public.concerns on delete cascade,
  author uuid not null references auth.users,
  from_staff boolean not null default false,
  body text not null check (length(btrim(body)) > 0),
  created_at timestamptz not null default now()
);

create table public.decisions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects on delete cascade,
  unit_id uuid references public.units on delete cascade,
  type text not null check (type in ('Dukungan perbaikan', 'Izin akses', 'Konfirmasi jadwal', 'Respons usulan finansial', 'Otorisasi manajemen')),
  by_user uuid not null references auth.users,
  version text,
  basis text,
  note text,
  created_at timestamptz not null default now()
);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects on delete cascade,
  name text not null,
  category text,
  visibility text not null default 'mgmt' check (visibility in ('all', 'mgmt', 'vendor')),
  storage_path text,
  uploaded_by uuid references auth.users,
  created_at timestamptz not null default now()
);

create table public.work_steps (
  project_id uuid not null references public.projects on delete cascade,
  step int not null check (step between 0 and 9),
  done_at timestamptz not null default now(),
  done_by uuid references auth.users,
  primary key (project_id, step)
);

create table public.event_log (
  id bigint generated always as identity primary key,
  building_id uuid not null references public.buildings on delete cascade,
  project_id uuid references public.projects on delete set null,
  actor uuid,
  actor_label text not null default 'sistem',
  action text not null,
  prev_value text not null default '-',
  next_value text not null default '-',
  visibility text not null default 'internal' check (visibility in ('internal', 'parties')),
  created_at timestamptz not null default now(),
  prev_hash text not null default '',
  hash text not null default ''
);
create index event_log_building on public.event_log (building_id, id);

create table public.reminder_prefs (
  user_id uuid primary key references auth.users on delete cascade,
  browser_notifications boolean not null default false,
  updated_at timestamptz not null default now()
);

-- ---------- fungsi bantu (SECURITY DEFINER agar tidak rekursif lewat RLS) ----------
create function public.is_manager(b uuid) returns boolean
  language sql stable security definer set search_path = public as
$$ select exists (select 1 from memberships where building_id = b and user_id = auth.uid() and role = 'manager') $$;

create function public.my_unit_ids() returns setof uuid
  language sql stable security definer set search_path = public as
$$ select unit_id from memberships where user_id = auth.uid() and role in ('owner', 'resident') $$;

create function public.project_building(p uuid) returns uuid
  language sql stable security definer set search_path = public as
$$ select building_id from projects where id = p $$;

create function public.is_party(p uuid) returns boolean
  language sql stable security definer set search_path = public as
$$ select exists (select 1 from project_units pu join projects pr on pr.id = pu.project_id
                  where pu.project_id = p and pr.status <> 'Draft' and pu.unit_id in (select my_unit_ids())) $$;

create function public.is_owner_party(p uuid) returns boolean
  language sql stable security definer set search_path = public as
$$ select exists (select 1 from project_units pu join memberships m on m.unit_id = pu.unit_id join projects pr on pr.id = pu.project_id
                  where pu.project_id = p and pr.status <> 'Draft' and m.user_id = auth.uid() and m.role = 'owner') $$;

create function public.is_vendor_of(p uuid) returns boolean
  language sql stable security definer set search_path = public as
$$ select exists (select 1 from projects pr join memberships m on m.vendor_id = pr.vendor_id
                  where pr.id = p and pr.status <> 'Draft' and m.user_id = auth.uid() and m.role = 'vendor') $$;

create function public.is_member(b uuid) returns boolean
  language sql stable security definer set search_path = public as
$$ select exists (select 1 from memberships where building_id = b and user_id = auth.uid()) $$;

-- ---------- log kejadian append-only dengan rantai hash ----------
create function public.event_log_chain() returns trigger language plpgsql as $$
declare last_hash text;
begin
  perform pg_advisory_xact_lock(hashtext(new.building_id::text));
  select hash into last_hash from public.event_log where building_id = new.building_id order by id desc limit 1;
  new.prev_hash := coalesce(last_hash, repeat('0', 64));
  new.hash := public.event_hash(new.building_id, new.id, new.project_id, new.actor_label, new.action, new.prev_value, new.next_value, new.visibility, new.created_at, new.prev_hash);
  return new;
end $$;

create function public.event_hash(b uuid, i bigint, p uuid, actor_label text, action text, pv text, nv text, vis text, at timestamptz, ph text)
  returns text language sql immutable as
$$ select encode(sha256(convert_to(jsonb_build_array(b, i, p, actor_label, action, pv, nv, vis, to_char(at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US'), ph)::text, 'UTF8')), 'hex') $$;

create trigger event_log_chain before insert on public.event_log for each row execute function public.event_log_chain();

create function public.forbid_mutation() returns trigger language plpgsql as $$
begin
  raise exception 'Tabel % bersifat append-only: UPDATE, DELETE, dan TRUNCATE tidak diizinkan', tg_table_name using errcode = 'insufficient_privilege';
end $$;

create trigger event_log_append_only before update or delete on public.event_log for each row execute function public.forbid_mutation();
create trigger event_log_no_truncate before truncate on public.event_log for each statement execute function public.forbid_mutation();
create trigger scenario_revisions_append_only before update or delete on public.scenario_revisions for each row execute function public.forbid_mutation();
create trigger concern_messages_append_only before update or delete on public.concern_messages for each row execute function public.forbid_mutation();
create trigger decisions_append_only before update or delete on public.decisions for each row execute function public.forbid_mutation();

-- Catat kejadian. Hanya dipanggil dari pemicu/fungsi di bawah; klien tidak punya hak INSERT pada event_log.
create function public.log_event(b uuid, p uuid, act text, pv text, nv text, vis text default 'internal') returns void
  language plpgsql security definer set search_path = public as $$
declare lbl text;
begin
  select display_name into lbl from profiles where id = auth.uid();
  insert into event_log (building_id, project_id, actor, actor_label, action, prev_value, next_value, visibility)
  values (b, p, auth.uid(), coalesce(lbl, 'sistem'), act, coalesce(pv, '-'), coalesce(nv, '-'), vis);
end $$;

-- Verifikasi rantai per gedung: mengembalikan id entri pertama yang rusak, atau null bila utuh.
create function public.verify_event_chain(b uuid) returns bigint
  language plpgsql stable security definer set search_path = public as $$
declare r record; expect_prev text := repeat('0', 64);
begin
  -- auth.uid() null berarti panggilan administratif (mis. migrasi/cron di server); klien selalu punya uid.
  if auth.uid() is not null and not is_manager(b) then raise exception 'hanya pengelola'; end if;
  for r in select * from event_log where building_id = b order by id loop
    if r.prev_hash <> expect_prev
       or r.hash <> event_hash(r.building_id, r.id, r.project_id, r.actor_label, r.action, r.prev_value, r.next_value, r.visibility, r.created_at, r.prev_hash) then
      return r.id;
    end if;
    expect_prev := r.hash;
  end loop;
  return null;
end $$;

create function public.trg_project_log() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    perform public.log_event(new.building_id, new.id, 'Proyek dibuat: ' || new.title, '-', new.status, 'internal');
  elsif new.status is distinct from old.status then
    perform public.log_event(new.building_id, new.id, 'Status proyek diubah', old.status, new.status, 'parties');
  end if;
  return new;
end $$;
create trigger project_log after insert or update on public.projects for each row execute function public.trg_project_log();

create function public.set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end $$;
create trigger project_touch before update on public.projects for each row execute function public.set_updated_at();

create function public.trg_revision_log() returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.log_event(public.project_building(new.project_id), new.project_id, 'Merevisi Skenario ' || new.key || ' (v' || new.version || ')', new.prev_pct || '% dana bersama', new.next_pct || '% dana bersama', 'parties');
  return new;
end $$;
create trigger revision_log after insert on public.scenario_revisions for each row execute function public.trg_revision_log();

create function public.trg_decision_log() returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.log_event(public.project_building(new.project_id), new.project_id, 'Keputusan tercatat: ' || new.type, '-', coalesce(new.note, '-'), case when new.unit_id is null then 'parties' else 'internal' end);
  return new;
end $$;
create trigger decision_log after insert on public.decisions for each row execute function public.trg_decision_log();

create function public.trg_concern_log() returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.log_event(public.project_building(new.project_id), new.project_id, 'Kekhawatiran diajukan (' || new.category || ')', '-', 'Baru', 'internal');
  return new;
end $$;
create trigger concern_log after insert on public.concerns for each row execute function public.trg_concern_log();

create function public.trg_work_log() returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.log_event(public.project_building(new.project_id), new.project_id, 'Langkah pelaksanaan selesai: nomor ' || new.step, '-', 'Selesai', 'parties');
  return new;
end $$;
create trigger work_log after insert on public.work_steps for each row execute function public.trg_work_log();

-- ---------- fungsi untuk tindakan terbatas ----------
-- Warga merespons permintaan akses untuk unitnya sendiri. Tidak ada UPDATE langsung pada project_units.
create function public.respond_access(p uuid, u uuid, new_status text) returns void
  language plpgsql security definer set search_path = public as $$
declare cur record;
begin
  if u not in (select my_unit_ids()) then raise exception 'bukan unit Anda' using errcode = 'insufficient_privilege'; end if;
  if new_status not in ('Accepted', 'Alternative Requested', 'Declined', 'Info Requested') then raise exception 'status tidak diizinkan'; end if;
  select * into cur from project_units where project_id = p and unit_id = u;
  if not found or cur.kind not in ('acc', 'both') then raise exception 'unit tidak diminta akses pada proyek ini'; end if;
  update project_units set access_status = new_status where project_id = p and unit_id = u;
  perform log_event(project_building(p), p, 'Merespons permintaan akses', cur.access_status, new_status, 'internal');
end $$;

-- Vendor melihat jadwal kerja berdasarkan kode unit saja: tanpa identitas penghuni, tanpa pembagian biaya.
create function public.vendor_schedule(p uuid)
  returns table (unit_code text, slot_date date, slot_time text, duration text, access_status text)
  language sql stable security definer set search_path = public as
$$ select un.code, pu.slot_date, pu.slot_time, pu.duration, pu.access_status
   from project_units pu join units un on un.id = pu.unit_id
   where pu.project_id = p and pu.kind in ('acc', 'both') and public.is_vendor_of(p)
     and pu.access_status in ('Accepted', 'Confirmed') $$;

-- Ringkasan agregat untuk pihak proyek: jumlah unit, tanpa identitas.
create function public.project_summary(p uuid)
  returns table (beneficiaries bigint, access bigint, disturbed bigint, total bigint)
  language sql stable security definer set search_path = public as
$$ select count(*) filter (where kind in ('ben', 'both')), count(*) filter (where kind in ('acc', 'both')),
          count(*) filter (where kind = 'dis'), count(*)
   from project_units where project_id = p and (is_manager(project_building(p)) or is_party(p) or is_vendor_of(p)) $$;

-- ---------- Row Level Security ----------
alter table public.buildings enable row level security;
alter table public.units enable row level security;
alter table public.profiles enable row level security;
alter table public.vendors enable row level security;
alter table public.memberships enable row level security;
alter table public.projects enable row level security;
alter table public.project_units enable row level security;
alter table public.cost_lines enable row level security;
alter table public.scenarios enable row level security;
alter table public.scenario_revisions enable row level security;
alter table public.concerns enable row level security;
alter table public.concern_messages enable row level security;
alter table public.decisions enable row level security;
alter table public.documents enable row level security;
alter table public.work_steps enable row level security;
alter table public.event_log enable row level security;
alter table public.reminder_prefs enable row level security;

create policy buildings_read on public.buildings for select to authenticated using (public.is_member(id));
create policy buildings_manage on public.buildings for all to authenticated using (public.is_manager(id)) with check (public.is_manager(id));

create policy units_read on public.units for select to authenticated using (public.is_manager(building_id) or id in (select public.my_unit_ids()));
create policy units_manage on public.units for all to authenticated using (public.is_manager(building_id)) with check (public.is_manager(building_id));

create policy profiles_read on public.profiles for select to authenticated using (
  id = auth.uid() or exists (select 1 from public.memberships mine join public.memberships theirs on theirs.building_id = mine.building_id
                             where mine.user_id = auth.uid() and mine.role = 'manager' and theirs.user_id = profiles.id));
create policy profiles_insert on public.profiles for insert to authenticated with check (id = auth.uid());
create policy profiles_update on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create policy vendors_read on public.vendors for select to authenticated using (
  public.is_manager(building_id) or exists (select 1 from public.memberships m where m.vendor_id = vendors.id and m.user_id = auth.uid()));
create policy vendors_manage on public.vendors for all to authenticated using (public.is_manager(building_id)) with check (public.is_manager(building_id));

create policy memberships_read on public.memberships for select to authenticated using (user_id = auth.uid() or public.is_manager(building_id));
create policy memberships_manage on public.memberships for all to authenticated using (public.is_manager(building_id)) with check (public.is_manager(building_id));

create policy projects_read on public.projects for select to authenticated using (
  public.is_manager(building_id) or (status <> 'Draft' and (public.is_party(id) or public.is_vendor_of(id))));
create policy projects_manage on public.projects for all to authenticated using (public.is_manager(building_id)) with check (public.is_manager(building_id));

-- project_units: vendor sengaja tidak punya akses langsung (pakai vendor_schedule).
create policy project_units_read on public.project_units for select to authenticated using (
  public.is_manager(public.project_building(project_id)) or (unit_id in (select public.my_unit_ids()) and public.is_party(project_id)));
create policy project_units_manage on public.project_units for all to authenticated using (public.is_manager(public.project_building(project_id))) with check (public.is_manager(public.project_building(project_id)));

-- Biaya: pengelola, pemilik pihak proyek (bukan penghuni), dan vendor penugasan.
create policy cost_lines_read on public.cost_lines for select to authenticated using (
  public.is_manager(public.project_building(project_id)) or public.is_owner_party(project_id) or public.is_vendor_of(project_id));
create policy cost_lines_manage on public.cost_lines for all to authenticated using (public.is_manager(public.project_building(project_id))) with check (public.is_manager(public.project_building(project_id)));

-- Skenario: pihak proyek hanya melihat yang sudah diterbitkan; vendor tidak melihat pembagian biaya.
create policy scenarios_read on public.scenarios for select to authenticated using (
  public.is_manager(public.project_building(project_id)) or (public.is_party(project_id) and status in ('Published for Feedback', 'Approved')));
create policy scenarios_manage on public.scenarios for all to authenticated using (public.is_manager(public.project_building(project_id))) with check (public.is_manager(public.project_building(project_id)));

create policy revisions_read on public.scenario_revisions for select to authenticated using (
  public.is_manager(public.project_building(project_id))
  or (public.is_party(project_id) and exists (select 1 from public.scenarios s where s.project_id = scenario_revisions.project_id and s.key = scenario_revisions.key and s.status in ('Published for Feedback', 'Approved'))));
create policy revisions_insert on public.scenario_revisions for insert to authenticated with check (public.is_manager(public.project_building(project_id)) and by_user = auth.uid());

create policy concerns_read on public.concerns for select to authenticated using (
  public.is_manager(public.project_building(project_id)) or unit_id in (select public.my_unit_ids()));
create policy concerns_insert on public.concerns for insert to authenticated with check (
  unit_id in (select public.my_unit_ids()) and raised_by = auth.uid() and public.is_party(project_id));
create policy concerns_update on public.concerns for update to authenticated using (public.is_manager(public.project_building(project_id))) with check (public.is_manager(public.project_building(project_id)));

create policy messages_read on public.concern_messages for select to authenticated using (
  exists (select 1 from public.concerns c where c.id = concern_id and (public.is_manager(public.project_building(c.project_id)) or c.unit_id in (select public.my_unit_ids()))));
create policy messages_insert on public.concern_messages for insert to authenticated with check (
  author = auth.uid() and exists (select 1 from public.concerns c where c.id = concern_id and (
    (public.is_manager(public.project_building(c.project_id)) and from_staff)
    or (c.unit_id in (select public.my_unit_ids()) and not from_staff))));

create policy decisions_read on public.decisions for select to authenticated using (
  public.is_manager(public.project_building(project_id)) or unit_id in (select public.my_unit_ids()) or (unit_id is null and public.is_party(project_id)));
create policy decisions_insert on public.decisions for insert to authenticated with check (
  by_user = auth.uid() and (
    public.is_manager(public.project_building(project_id))
    or (unit_id in (select public.my_unit_ids()) and public.is_party(project_id)
        and type in ('Dukungan perbaikan', 'Izin akses', 'Respons usulan finansial')
        and (type <> 'Respons usulan finansial' or exists (select 1 from public.memberships m where m.user_id = auth.uid() and m.unit_id = decisions.unit_id and m.role = 'owner')))));

create policy documents_read on public.documents for select to authenticated using (
  public.is_manager(public.project_building(project_id))
  or (visibility = 'all' and (public.is_party(project_id) or public.is_vendor_of(project_id)))
  or (visibility = 'vendor' and public.is_vendor_of(project_id)));
create policy documents_manage on public.documents for all to authenticated using (public.is_manager(public.project_building(project_id))) with check (public.is_manager(public.project_building(project_id)));

create policy work_read on public.work_steps for select to authenticated using (
  public.is_manager(public.project_building(project_id)) or public.is_party(project_id) or public.is_vendor_of(project_id));
create policy work_manage on public.work_steps for all to authenticated using (public.is_manager(public.project_building(project_id))) with check (public.is_manager(public.project_building(project_id)));
create policy work_vendor_insert on public.work_steps for insert to authenticated with check (public.is_vendor_of(project_id) and step between 3 and 6 and done_by = auth.uid());

create policy event_log_read on public.event_log for select to authenticated using (
  public.is_manager(building_id) or actor = auth.uid()
  or (visibility = 'parties' and project_id is not null and (public.is_party(project_id) or public.is_vendor_of(project_id))));

create policy reminder_prefs_own on public.reminder_prefs for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------- hak tabel ----------
grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
-- Tabel append-only dan log: klien tidak boleh mengubah/menghapus; log hanya lewat fungsi.
revoke update, delete, truncate on public.scenario_revisions, public.concern_messages, public.decisions from authenticated;
revoke insert, update, delete, truncate on public.event_log from authenticated;
grant execute on function public.respond_access(uuid, uuid, text), public.vendor_schedule(uuid), public.project_summary(uuid), public.verify_event_chain(uuid) to authenticated;
revoke execute on function public.log_event(uuid, uuid, text, text, text, text) from public, authenticated;

-- Realtime (hanya bila publikasi Supabase ada).
do $$ begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.projects, public.project_units, public.concerns, public.concern_messages, public.decisions, public.event_log;
  end if;
end $$;
