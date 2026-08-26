-- ============================================================
-- Public rental site + Stripe integration
--
-- Lets ONE organization at a time opt into anonymous read access to its
-- own unit availability (for the public rental site's live unit grid),
-- and adds the columns the Netlify checkout function
-- (../Accurate Storage Station/netlify/functions/charge.js) and its new
-- recurring-payment webhook need to write real rentals into this
-- database instead of emailing a gate code and forgetting about it.
--
-- Apply after schema.sql + policies.sql.
-- ============================================================

-- ------------------------------------------------------------
-- Public unit listing (opt-in, per organization)
-- ------------------------------------------------------------

alter table organizations
  add column public_availability_enabled boolean not null default false;

-- Anonymous read of units, but ONLY for organizations that opted in.
-- This is the one deliberate crack in an otherwise fully RLS-isolated
-- multi-tenant schema — every other table stays admin/staff-only. Unit
-- number/size/rate/status is exactly what the old static site already
-- published to the world; nothing new is exposed. stripe_price_id is not
-- a secret (it's used client-side in Stripe.js flows anyway); `notes` is
-- mildly internal but low-severity if read directly via the REST API
-- rather than through the site's own UI — accepted as a v1 tradeoff
-- rather than adding a second table/view just to hide it.
create policy "units: public listing when organization opted in"
  on units for select
  to anon
  using (
    organization_id in (select id from organizations where public_availability_enabled = true)
  );

-- ------------------------------------------------------------
-- Richer tenant intake — the public site's lease form collects far more
-- than the dashboard's own "Add Tenant" modal does (address, vehicle,
-- lienholder, alternate contact, military status, signed lease text,
-- autopay authorization). Structured columns for the fields the
-- dashboard's own UI might reasonably filter/display on; everything else
-- goes in intake_details so no future public-site field addition needs a
-- schema migration.
-- ------------------------------------------------------------

alter table tenants
  add column address_line1 text,
  add column city text,
  add column state text,
  add column postal_code text,
  add column vehicle_info text,
  add column stripe_customer_id text,
  add column stripe_subscription_id text,
  add column intake_details jsonb;

comment on column tenants.intake_details is
  'Everything from the public site''s lease form not worth its own column: '
  'alternate contact, lienholder, military status, DL number/state, signed '
  'lease text + signature, autopay authorization + signature.';

-- Recurring-payment webhook (stripe-webhook.js) looks tenants up by
-- subscription id on every invoice event — needs to be fast and unique.
create unique index tenants_stripe_subscription_id_idx
  on tenants (stripe_subscription_id)
  where stripe_subscription_id is not null;
