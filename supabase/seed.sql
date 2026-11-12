-- Copyright (c) 2026 Vassel Goleyu. All rights reserved.
-- Data FIKTIF untuk pengembangan lokal (supabase start). Tidak membuat pengguna: buat akun lewat Supabase Auth,
-- lalu tautkan lewat memberships (lihat README, bagian Mode Supabase).
insert into public.buildings (id, name) values ('00000000-0000-4000-8000-000000000100', 'Northpoint Residence (demo fiktif)') on conflict do nothing;
insert into public.units (building_id, code, tower, floor)
select '00000000-0000-4000-8000-000000000100', 'A-08-' || lpad(n::text, 2, '0'), 'Tower A', 8 from generate_series(1, 14) n on conflict do nothing;
insert into public.vendors (id, building_id, name) values ('00000000-0000-4000-8000-000000000300', '00000000-0000-4000-8000-000000000100', 'PT Tirta Mandiri (fiktif)') on conflict do nothing;
