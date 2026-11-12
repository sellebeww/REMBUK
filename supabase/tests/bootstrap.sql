-- Copyright (c) 2026 Vassel Goleyu. All rights reserved.
-- Meniru bagian Supabase yang dibutuhkan migrasi, HANYA untuk tes lokal (PGlite). Jangan dijalankan di Supabase.
create schema if not exists auth;
create table auth.users (id uuid primary key, email text);
create function auth.uid() returns uuid language sql stable as
$$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
create role anon nologin;
create role authenticated nologin;
grant usage on schema auth to authenticated;
grant execute on function auth.uid() to authenticated;
