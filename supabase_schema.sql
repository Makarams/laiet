-- LA-IET.EXE — Supabase schema
-- Idempotent: safe to re-run. Drops and recreates all application tables.
-- Run in: Supabase Dashboard > SQL Editor > New Query

-- ─── Tear down existing schema ────────────────────────────────────────────────

alter table if exists fossil_records disable row level security;
alter table if exists colonies       disable row level security;
drop policy if exists "fossils_delete" on fossil_records;
drop policy if exists "fossils_insert" on fossil_records;
drop policy if exists "fossils_select" on fossil_records;
drop policy if exists "colonies_delete" on colonies;
drop policy if exists "colonies_update" on colonies;
drop policy if exists "colonies_insert" on colonies;
drop policy if exists "colonies_select" on colonies;
drop function if exists public.reset_user_data();
drop function if exists public.admin_reset_all_app_data(text);
drop table if exists fossil_records;
drop table if exists colonies;

-- ─── Tables ───────────────────────────────────────────────────────────────────

-- One row per world per user. Upserted on every save; the full GameState JSONB
-- blob is under 200 KB at max population.
create table colonies (
  world_id    uuid        primary key,
  user_id     uuid        not null references auth.users(id) on delete cascade,
  state       jsonb       not null,
  updated_at  timestamptz not null default now()
);

create index colonies_user_id_idx on colonies (user_id);

-- Immutable extinction records. Persist across resets so the player's full
-- history survives colony death. Hard-deleted only on explicit user request.
create table fossil_records (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references auth.users(id) on delete cascade,
  fossil      jsonb       not null,
  created_at  timestamptz not null default now()
);

create index fossil_records_user_id_idx on fossil_records (user_id);

-- ─── Row Level Security ───────────────────────────────────────────────────────

alter table colonies       enable row level security;
alter table fossil_records enable row level security;

-- colonies: full CRUD scoped to the owning user
create policy "colonies_select" on colonies
  for select using (auth.uid() = user_id);

create policy "colonies_insert" on colonies
  for insert with check (auth.uid() = user_id);

create policy "colonies_update" on colonies
  for update using (auth.uid() = user_id);

create policy "colonies_delete" on colonies
  for delete using (auth.uid() = user_id);

-- fossil_records: insert + select by owner; delete allowed (hard-delete on reset)
create policy "fossils_select" on fossil_records
  for select using (auth.uid() = user_id);

create policy "fossils_insert" on fossil_records
  for insert with check (auth.uid() = user_id);

create policy "fossils_delete" on fossil_records
  for delete using (auth.uid() = user_id);

-- ─── Per-user data reset (SECURITY DEFINER) ───────────────────────────────────
--
-- Callable by any authenticated user to wipe all their own application data
-- while leaving their auth.users row intact. auth.uid() is resolved server-side
-- so a caller cannot delete another user's rows regardless of what they pass.
--
-- FK ordering: fossil_records and colonies both reference auth.users but not
-- each other, so deletion order between them is arbitrary. We delete
-- fossil_records first by convention (child-before-parent style).
--
-- Primary key note: both tables use uuid PKs (gen_random_uuid()). UUIDs are
-- not backed by a PostgreSQL sequence, so RESTART IDENTITY does not apply
-- here. Every new row gets a collision-free UUID without any counter to reset.
-- If integer PKs are added in future migrations, update this function to
-- include RESTART IDENTITY on those sequences.
create or replace function public.reset_user_data()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'not authenticated — call requires a valid session';
  end if;

  delete from public.fossil_records where user_id = v_uid;
  delete from public.colonies       where user_id = v_uid;
end;
$$;

revoke all    on function public.reset_user_data() from public, anon;
grant  execute on function public.reset_user_data() to authenticated;

-- ─── Full application data reset — service role only ─────────────────────────
--
-- Truncates ALL rows from all application tables. Only callable with the
-- Supabase service key (which bypasses RLS). Never exposed to the client SDK.
--
-- Usage (dashboard SQL editor or trusted backend):
--   select admin_reset_all_app_data('CONFIRM_RESET');
--
-- The p_confirm gate prevents accidental execution.
--
-- TRUNCATE ... RESTART IDENTITY CASCADE:
--   • RESTART IDENTITY — resets any attached sequences to their start value.
--     No-op on uuid columns, included for forward-compatibility with any
--     future integer-PK tables added to the application schema.
--   • CASCADE — temporarily disables referential integrity checks within the
--     truncated set so FK ordering does not matter. Constraints remain in
--     place after the statement completes; no permanent schema change occurs.
create or replace function public.admin_reset_all_app_data(p_confirm text default '')
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_confirm <> 'CONFIRM_RESET' then
    raise exception
      'safety gate: pass p_confirm := ''CONFIRM_RESET'' to execute this function';
  end if;

  -- Truncate child table first (fossil_records), then parent (colonies).
  -- Both reference auth.users — not each other — so the FK ordering here
  -- is by convention; CASCADE handles any FK dependencies automatically.
  truncate table public.fossil_records restart identity cascade;
  truncate table public.colonies       restart identity cascade;
end;
$$;

-- Accessible only by service role. No grant to anon or authenticated.
revoke all on function public.admin_reset_all_app_data(text) from public, anon, authenticated;
