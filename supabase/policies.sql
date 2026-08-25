-- ============================================================
-- Accurate Storage — Row Level Security policies
--
-- schema.sql (as provided) creates every table with RLS off, which on a
-- standard Supabase project means the `anon`/`authenticated` roles would
-- otherwise have full read/write access via the default schema grants —
-- i.e. without this file, anyone with the anon key (which ships in the
-- browser bundle) could read and write every row, across every
-- organization, directly against PostgREST, bypassing this app entirely.
-- That risk is sharper here than in a single-tenant app: without RLS,
-- one facility could read another facility's tenants, payments, and gate
-- codes.
--
-- This file only adds security (RLS + policies) — it does not touch or
-- drop any table. Apply schema.sql then this file, in order, on a fresh
-- project.
-- ============================================================

-- ------------------------------------------------------------
-- Helper functions
-- ------------------------------------------------------------

-- The `organization_id` of the currently-authenticated user's active team
-- row, if any. Every other policy below keys off this — it is the entire
-- tenant-isolation boundary.
create or replace function public.current_org_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select organization_id from team where auth_user_id = auth.uid() and active = true limit 1;
$$;

-- True if the current user holds `key` (or the blanket 'admin' key) in
-- team_permissions, scoped to their own organization. Mirrors
-- src/lib/auth/permissions.ts's hasPermission().
create or replace function public.has_permission(key text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from team_permissions tp
    join team t on t.id = tp.team_id
    where t.auth_user_id = auth.uid()
      and t.active = true
      and (tp.permission_key = key or tp.permission_key = 'admin')
  );
$$;

-- ------------------------------------------------------------
-- organizations — a signed-in user may read/update only their own
-- organization row. Insert happens via the signup flow's admin client
-- (src/lib/auth/account-provisioning.ts createOrganizationWithAdmin),
-- not as the anon/authenticated role, so there is no anon insert policy
-- here — a public self-serve signup writing directly as `anon` would let
-- anyone create organizations with no matching Auth user at all.
-- ------------------------------------------------------------

alter table organizations enable row level security;

create policy "org: read own"
  on organizations for select
  using (id = current_org_id());

create policy "org: admin can update own"
  on organizations for update
  using (id = current_org_id() and has_permission('admin'))
  with check (id = current_org_id() and has_permission('admin'));

-- ------------------------------------------------------------
-- team / team_permissions
-- ------------------------------------------------------------

alter table team enable row level security;

create policy "team: read within org"
  on team for select
  using (organization_id = current_org_id());

-- Lets a newly-signed-up user (whose auth_user_id an admin-side process
-- already stamped onto their own row — see account-provisioning.ts) show
-- up as themselves even before any other policy would resolve
-- current_org_id() for them. Narrow: only claiming a row that already
-- matches your own email is not the general case account-provisioning
-- needs (creating the org's first admin), which still goes through the
-- service_role admin client.
create policy "team: self-link by email"
  on team for update
  using (auth_user_id is null and email = auth.jwt() ->> 'email')
  with check (auth_user_id = auth.uid());

create policy "team: admin can manage within org"
  on team for all
  using (organization_id = current_org_id() and has_permission('admin'))
  with check (organization_id = current_org_id() and has_permission('admin'));

alter table team_permissions enable row level security;

create policy "team_permissions: read within org"
  on team_permissions for select
  using (team_id in (select id from team where organization_id = current_org_id()));

create policy "team_permissions: admin can manage within org"
  on team_permissions for all
  using (team_id in (select id from team where organization_id = current_org_id() and has_permission('admin')))
  with check (team_id in (select id from team where organization_id = current_org_id() and has_permission('admin')));

-- ------------------------------------------------------------
-- units
-- ------------------------------------------------------------

alter table units enable row level security;

create policy "units: read within org"
  on units for select
  using (organization_id = current_org_id() and has_permission('view_units'));

create policy "units: write within org"
  on units for all
  using (organization_id = current_org_id() and has_permission('edit_units'))
  with check (organization_id = current_org_id() and has_permission('edit_units'));

-- ------------------------------------------------------------
-- tenants
-- ------------------------------------------------------------

alter table tenants enable row level security;

create policy "tenants: read within org"
  on tenants for select
  using (organization_id = current_org_id() and has_permission('view_tenants'));

create policy "tenants: write within org"
  on tenants for all
  using (organization_id = current_org_id() and has_permission('edit_tenants'))
  with check (organization_id = current_org_id() and has_permission('edit_tenants'));

-- ------------------------------------------------------------
-- payments
-- ------------------------------------------------------------

alter table payments enable row level security;

create policy "payments: read within org"
  on payments for select
  using (organization_id = current_org_id() and has_permission('view_payments'));

create policy "payments: write within org"
  on payments for all
  using (organization_id = current_org_id() and has_permission('edit_payments'))
  with check (organization_id = current_org_id() and has_permission('edit_payments'));

-- ------------------------------------------------------------
-- gate_codes
-- ------------------------------------------------------------

alter table gate_codes enable row level security;

create policy "gate_codes: read within org"
  on gate_codes for select
  using (organization_id = current_org_id() and has_permission('view_gate_access'));

create policy "gate_codes: write within org"
  on gate_codes for all
  using (organization_id = current_org_id() and has_permission('edit_gate_access'))
  with check (organization_id = current_org_id() and has_permission('edit_gate_access'));

-- ------------------------------------------------------------
-- activity_log — readable by anyone in the org with dashboard access;
-- written by server actions/webhooks using the admin client (a plain
-- INSERT policy would also work here since every writer is already
-- permission-checked at the action level, but the admin client is used
-- so webhook-triggered inserts — which have no user session at all —
-- work the same way as in-app ones).
-- ------------------------------------------------------------

alter table activity_log enable row level security;

create policy "activity_log: read within org"
  on activity_log for select
  using (organization_id = current_org_id());
