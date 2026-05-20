-- LA-IET.EXE — initial schema
-- Applied automatically by the Supabase GitHub integration on push.
-- Idempotent: every statement is guarded so a re-run can neither fail nor
-- destroy data.

-- ─── Tables ─────────────────────────────────────────────────────────────────

-- One row per world per user. Upserted on every save; the full GameState
-- JSONB blob stays under ~200 KB at max population.
create table if not exists colonies (
  world_id    uuid        primary key,
  user_id     uuid        not null references auth.users(id) on delete cascade,
  state       jsonb       not null,
  updated_at  timestamptz not null default now()
);
create index if not exists colonies_user_id_idx on colonies (user_id);

-- Immutable extinction records. Persist across resets so a player's full
-- history survives colony death. Hard-deleted only on explicit user request.
create table if not exists fossil_records (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references auth.users(id) on delete cascade,
  fossil      jsonb       not null,
  created_at  timestamptz not null default now()
);
create index if not exists fossil_records_user_id_idx on fossil_records (user_id);

-- ─── Row Level Security ─────────────────────────────────────────────────────

alter table colonies       enable row level security;
alter table fossil_records enable row level security;

-- Policies have no CREATE OR REPLACE form — drop-then-create keeps this
-- migration safely re-runnable.
drop policy if exists "colonies_select" on colonies;
drop policy if exists "colonies_insert" on colonies;
drop policy if exists "colonies_update" on colonies;
drop policy if exists "colonies_delete" on colonies;
create policy "colonies_select" on colonies for select using (auth.uid() = user_id);
create policy "colonies_insert" on colonies for insert with check (auth.uid() = user_id);
create policy "colonies_update" on colonies for update using (auth.uid() = user_id);
create policy "colonies_delete" on colonies for delete using (auth.uid() = user_id);

drop policy if exists "fossils_select" on fossil_records;
drop policy if exists "fossils_insert" on fossil_records;
drop policy if exists "fossils_delete" on fossil_records;
create policy "fossils_select" on fossil_records for select using (auth.uid() = user_id);
create policy "fossils_insert" on fossil_records for insert with check (auth.uid() = user_id);
create policy "fossils_delete" on fossil_records for delete using (auth.uid() = user_id);

-- ─── Per-user data reset (SECURITY DEFINER) ─────────────────────────────────
-- Callable by any authenticated user to wipe their own application data while
-- leaving their auth.users row intact. auth.uid() resolves server-side, so a
-- caller can never delete another user's rows regardless of what they pass.
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

revoke all     on function public.reset_user_data() from public, anon;
grant  execute on function public.reset_user_data() to authenticated;

-- ─── Full application reset — service role only ─────────────────────────────
-- Truncates ALL application rows. Gated behind p_confirm so it cannot fire by
-- accident. Never granted to the client SDK — callable only with the service
-- key or from the dashboard SQL editor:
--   select admin_reset_all_app_data('CONFIRM_RESET');
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

  truncate table public.fossil_records restart identity cascade;
  truncate table public.colonies       restart identity cascade;
end;
$$;

revoke all on function public.admin_reset_all_app_data(text) from public, anon, authenticated;
