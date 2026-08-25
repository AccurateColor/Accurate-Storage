# Accurate Storage — Facility Management

Multi-tenant SaaS for self-storage facility operators: units, leads &
tenants, payments/billing, delinquency, gate access, and (fast-follow)
automation, contacts, tasks, reports, marketing, and documents. Built from
Claude Design's high-fidelity dashboard handoff
(`../Accurate Storage Station/Accurate Storage Design System.zip`) plus a
richer layout mockup Callie supplied mid-build (stat cards with
sparklines, a revenue bar chart, a unit-status donut, an integrations
row).

Architecturally a sibling of, and deliberately consistent with,
`../amazing-spaces-app` — that project's own README calls itself "a
reusable template for future client builds," and this is the first one:
the Supabase client setup, the admin-provisioned-login pattern, the
permission-checking approach, and the RLS security posture are all
carried over unchanged. The one structural addition is multi-tenancy —
every domain table carries `organization_id`, and `current_org_id()`
(the RLS equivalent of that project's `current_team_id()`) is the entire
tenant-isolation boundary. See `supabase/schema.sql` and
`supabase/policies.sql`.

## Stack

- Next.js 16 (App Router), TypeScript, Tailwind CSS 4
- Supabase (Postgres + Auth) via `@supabase/ssr`
- No ORM — plain `supabase-js` queries, typed against `src/types/database.ts`
- No chart library — `Sparkline`/`BarChart`/`DonutChart` in
  `src/components/ui/` are small hand-written inline-SVG components

## Getting started

```bash
npm install
cp .env.local.example .env.local   # fill in the three Supabase values below
npm run dev
```

Env vars (Project Settings → Data API in the Supabase dashboard):

```
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon/publishable key>
SUPABASE_SERVICE_ROLE_KEY=<service_role key>
```

Then, on a **fresh** Supabase project, run `supabase/schema.sql` then
`supabase/policies.sql` (in that order) in the SQL Editor. Unlike Amazing
Spaces' schema, `SUPABASE_SERVICE_ROLE_KEY` is not optional here — signup
(creating a brand-new organization + its first admin login) and
admin-provisioned team member logins both require it; there is no
degraded-but-working mode without it, because there is no other way to
create the very first login on a new facility's account.

## Multi-tenancy

One Supabase project, one Postgres database, serves every facility
(`organizations` row) that signs up. There is no per-tenant database or
schema. Isolation is entirely RLS: `current_org_id()` resolves the
signed-in user's own `team.organization_id`, and every policy in
`policies.sql` filters on it. A bug in a page's own query can accidentally
show stale UI; it cannot leak another facility's rows, because Postgres
itself refuses the read/write regardless of what the app asked for.

## Security — read this before going live

Same warning as Amazing Spaces' own README, sharper here because this is
multi-tenant: `supabase/schema.sql`, as provided, creates every table
with RLS **off**. Apply `policies.sql` right after it, in order, on any
fresh project. Without it, the `anon` key (which ships in the browser
bundle) would read and write every organization's units, tenants,
payments, and gate codes — not just your own.

`organizations.stripe_secret_key` is a real secret. RLS keeps it scoped
to that organization's own admin (same as any other column), but no
Server Component or query that renders it should ever be sent to a
Client Component — it belongs in server actions only. The Settings page's
Stripe form field masks it (`type="password"`) but does not encrypt it at
rest; treat the whole `organizations` table as sensitive.

## What's built (v1 core)

Dashboard, Units, Leads & Tenants, Payments & Billing, Delinquency, Gate
Access, Settings (Branding, Theme Customization with live per-organization
color overrides, Stripe keys, Team Management). Self-serve trial signup
(no credit card — `organizations.trial_ends_at` defaults to 14 days out,
enforcement is not built yet, just the countdown banner). Auth is
Supabase email/password; team members are added by an admin and given a
password directly (Settings > Team Management > Set Password) rather
than through Supabase's own invitation email — same reasoning as Amazing
Spaces' `account-provisioning.ts`: that flow isn't a dependable path on
the free tier.

Automation, Contacts, Tasks & Reminders, Reports, Marketing & Social, and
Documents are in the sidebar as "Soon" — no page, backing table, or scope
yet, shown so the nav reflects where this is headed (same treatment
Amazing Spaces uses for its own not-yet-built tabs).

## What's deliberately not built yet

- **Billing for the SaaS itself.** Trials don't currently expire/lock
  anything — `organizations.plan`/`trial_ends_at` exist and the Dashboard
  shows a countdown, but nothing currently converts a trial to a paid
  subscription or blocks access after it ends.
- **Stripe Connect.** Facilities collect rent from their own tenants via
  manually-pasted Stripe keys (Settings), not OAuth. The
  `organizations.stripe_secret_key` / `stripe_publishable_key` columns and
  a real Stripe **webhook** that turns a successful checkout into
  tenant/payment/gate-code rows are the natural next step — no webhook
  route exists yet.
- **The public accuratestorage.net rental site** (`../Accurate Storage
  Station/index.html`, on Netlify) is untouched. It still uses its own
  hardcoded unit list and `netlify/functions/charge.js` for checkout,
  unconnected to this database. Wiring it to read live unit
  availability/pricing from this org's `units` table (and to write real
  tenant/payment rows on a successful rental) is a deliberate fast-follow,
  not done in this pass.
- **Custom Fields, Custom Widgets, Notification Preferences** — listed in
  the original design handoff's Settings spec; stubbed as "Coming Soon"
  tiles, no backing schema.

## Files

- `supabase/schema.sql` — tables (RLS off)
- `supabase/policies.sql` — RLS policies; apply after schema.sql
- `src/lib/auth/account-provisioning.ts` — org+admin signup, team member
  password provisioning (the two `service_role` call sites)
- `src/lib/auth/permissions.ts` — `getCurrentUser()` / `hasPermission()`
