-- LA-IET.EXE — backend performance tuning
-- Applied automatically by the Supabase GitHub integration after the initial
-- schema migration. Idempotent and safe to re-run.

-- ── 1. Indexes matching the app's exact read patterns ───────────────────────
--   loadFromCloud      — where user_id = ? order by updated_at  desc limit 1
--   loadFossilRecords  — where user_id = ? order by created_at  desc limit 50
-- A composite (user_id, <timestamp> desc) index satisfies the filter + sort +
-- limit from the index alone, so Postgres skips a per-query sort. These
-- supersede the plain single-column user_id indexes.
drop index if exists colonies_user_id_idx;
drop index if exists fossil_records_user_id_idx;
create index if not exists colonies_user_updated_idx
  on colonies (user_id, updated_at desc);
create index if not exists fossil_records_user_created_idx
  on fossil_records (user_id, created_at desc);

-- ── 2. RLS policies — evaluate auth.uid() once per statement ────────────────
-- A bare `auth.uid() = user_id` re-runs the function for every row scanned.
-- Wrapping it in a scalar subquery — `(select auth.uid())` — lets the planner
-- hoist it to a one-time initplan. Semantically identical; rows are still
-- scoped to their owner. This is the standard Supabase RLS tuning.
drop policy if exists "colonies_select" on colonies;
drop policy if exists "colonies_insert" on colonies;
drop policy if exists "colonies_update" on colonies;
drop policy if exists "colonies_delete" on colonies;
create policy "colonies_select" on colonies for select using ((select auth.uid()) = user_id);
create policy "colonies_insert" on colonies for insert with check ((select auth.uid()) = user_id);
create policy "colonies_update" on colonies for update using ((select auth.uid()) = user_id);
create policy "colonies_delete" on colonies for delete using ((select auth.uid()) = user_id);

drop policy if exists "fossils_select" on fossil_records;
drop policy if exists "fossils_insert" on fossil_records;
drop policy if exists "fossils_delete" on fossil_records;
create policy "fossils_select" on fossil_records for select using ((select auth.uid()) = user_id);
create policy "fossils_insert" on fossil_records for insert with check ((select auth.uid()) = user_id);
create policy "fossils_delete" on fossil_records for delete using ((select auth.uid()) = user_id);
