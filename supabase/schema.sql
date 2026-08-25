-- ============================================================
-- Accurate Storage — Facility Management SaaS — Supabase Schema
--
-- Multi-tenant from the ground up: every domain table carries
-- organization_id and is scoped to it by RLS (see policies.sql).
-- One Supabase project serves every facility (organization) that
-- signs up; there is no per-tenant database.
--
-- Modeled after, and deliberately consistent with, the Amazing
-- Spaces Operations Center schema/policies pattern (team +
-- team_permissions, admin-provisioned logins instead of relying on
-- Supabase's own confirmation email, a service_role "admin client"
-- reserved for cross-user server actions only) — see that project's
-- README.md "Security" section for the reasoning this repeats.
-- ============================================================

create extension if not exists "uuid-ossp";

-- ------------------------------------------------------------
-- Organizations = tenants. One row per storage facility account.
-- Everything else in this schema hangs off organization_id.
-- ------------------------------------------------------------

create table organizations (
  id uuid primary key default uuid_generate_v4(),
  name text not null,                          -- facility display name, e.g. "Accurate Storage"
  slug text not null unique,                    -- url-safe, reserved for future subdomain/branding use
  plan text not null default 'trial'
    check (plan in ('trial', 'active', 'canceled')),
  trial_ends_at timestamptz not null default (now() + interval '14 days'),
  -- Branding (Settings > Theme Customization / Branding)
  primary_color text not null default '#1D3557',
  accent_color text not null default '#E8175D',
  logo_url text,
  address_line1 text,
  address_line2 text,
  city text,
  state text,
  postal_code text,
  -- Manual per-facility Stripe keys (v1 — collecting rent from THEIR tenants;
  -- separate from any future billing WE charge them for the SaaS itself).
  -- Secret key is sensitive: never select it in any query whose result can
  -- reach a Client Component or the browser bundle — server actions only.
  -- Stripe Connect (OAuth, no key-pasting) is the intended long-term
  -- replacement; deferred, see README.md.
  stripe_secret_key text,
  stripe_publishable_key text,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Team (staff logins). Mirrors amazing-spaces-app's team +
-- team_permissions exactly, with organization_id added for
-- multi-tenancy. Auth itself is handled by Supabase Auth, not
-- this table.
-- ------------------------------------------------------------

create table team (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  auth_user_id uuid references auth.users(id),  -- links to Supabase Auth
  name text not null,
  email text not null,
  phone text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (organization_id, email)
);

create table team_permissions (
  id uuid primary key default uuid_generate_v4(),
  team_id uuid not null references team(id) on delete cascade,
  permission_key text not null,  -- 'admin', 'view_units', 'edit_units', 'view_tenants', 'edit_tenants',
                                  -- 'view_payments', 'edit_payments', 'view_delinquency',
                                  -- 'view_gate_access', 'edit_gate_access', 'view_settings'
  unique (team_id, permission_key)
);

-- ------------------------------------------------------------
-- Units — the physical inventory being rented out.
-- ------------------------------------------------------------

create table units (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  unit_number text not null,
  size text,                    -- e.g. '10x10'
  square_footage int,
  monthly_rate numeric(10, 2) not null default 0,
  status text not null default 'vacant'
    check (status in ('vacant', 'occupied', 'reserved', 'maintenance')),
  stripe_price_id text,         -- price on the facility's own connected/manual Stripe account
  notes text,
  created_at timestamptz not null default now(),
  unique (organization_id, unit_number)
);

-- ------------------------------------------------------------
-- Tenants — "Leads & Tenants" page. A lead becomes a tenant in
-- place (status change) rather than moving rows between tables,
-- so history/notes/contact info survive the transition.
-- ------------------------------------------------------------

create table tenants (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  email text,
  phone text,
  status text not null default 'lead'
    check (status in ('lead', 'active', 'past', 'delinquent')),
  unit_id uuid references units(id) on delete set null,
  lease_start date,
  lease_end date,
  source text,                  -- lead source, e.g. 'Website', 'Referral', 'Walk-in'
  notes text,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Payments — billing history. Delinquency is derived from this
-- table (status = 'late'), not tracked separately, so there is
-- exactly one place a payment's state can drift out of sync.
-- ------------------------------------------------------------

create table payments (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  tenant_id uuid not null references tenants(id) on delete cascade,
  unit_id uuid references units(id) on delete set null,
  amount numeric(10, 2) not null,
  due_date date not null,
  paid_date date,
  status text not null default 'due'
    check (status in ('paid', 'due', 'late')),
  method text,                  -- 'card', 'ach', 'cash', 'check', ...
  stripe_payment_intent_id text,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Gate access codes — tenant units + one-off visitor/vendor passes.
-- ------------------------------------------------------------

create table gate_codes (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  label text not null,          -- tenant name, or a visitor/vendor description
  tenant_id uuid references tenants(id) on delete set null,
  unit_id uuid references units(id) on delete set null,
  code text not null,
  vehicle_plate text,
  access_level text not null default 'tenant'
    check (access_level in ('tenant', 'staff', 'visitor', 'vendor')),
  active boolean not null default true,
  expires_at timestamptz,       -- null = no expiration (standard tenant codes)
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Activity log — feeds the Dashboard's Recent Activity widget.
-- Written by server actions/webhooks as things happen, not
-- reconstructed from other tables at read time.
-- ------------------------------------------------------------

create table activity_log (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  type text not null,           -- 'lease_signed', 'payment_received', 'payment_failed', 'gate_code_used', 'lead_received', ...
  message text not null,
  tenant_id uuid references tenants(id) on delete set null,
  unit_id uuid references units(id) on delete set null,
  created_at timestamptz not null default now()
);
