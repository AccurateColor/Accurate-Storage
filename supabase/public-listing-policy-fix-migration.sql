-- ============================================================
-- Fixes public-site-stripe-integration-migration.sql's "units: public
-- listing when organization opted in" policy, which silently matched
-- nothing for the `anon` role.
--
-- Root cause: that policy's USING clause subqueries `organizations`, but
-- organizations ALSO has RLS enabled (policies.sql) with no policy
-- granting anon any access to it at all — so from anon's perspective the
-- subquery always sees zero rows, and `organization_id in (select ...)`
-- is always false. Confirmed live: a service_role read of units for the
-- opted-in Accurate Storage org returned rows; the identical anon-key
-- read of the same org returned [].
--
-- Fix: same pattern already used for current_org_id()/has_permission() —
-- a `security definer` function runs as its owner, bypassing RLS on the
-- tables it reads internally, regardless of the calling role.
-- ============================================================

create or replace function public.org_allows_public_listing(org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select public_availability_enabled from organizations where id = org_id),
    false
  );
$$;

drop policy if exists "units: public listing when organization opted in" on units;

create policy "units: public listing when organization opted in"
  on units for select
  to anon
  using (org_allows_public_listing(organization_id));
