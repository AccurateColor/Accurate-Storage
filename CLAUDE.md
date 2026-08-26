@AGENTS.md

# Accurate Storage — Facility Management (Next.js + Supabase)

**This is the active build.** Read README.md first — it covers the stack,
multi-tenancy, security posture, what's built, and what's deliberately
not built yet. This file is just the pointer + a running status log, same
convention `../amazing-spaces-app/CLAUDE.md` uses.

## Status (2026-08-26, later) — connected to the public rental site + real Stripe account

Callie asked to connect her existing accuratestorage.net (Netlify, drag-
and-drop deploy — not git-connected, so changes there don't push through
this repo) and her real Stripe account. Built:

- `organizations.public_availability_enabled` (opt-in) +
  `units.stripe_price_id` (now editable from the Units page) — the public
  site reads live unit number/size/rate/vacancy straight from this
  database via the anon key instead of a hardcoded array. First RLS
  attempt silently matched nothing for `anon` (subquery on
  `organizations`, which has its own RLS blocking anon entirely) —
  fixed with a `security definer` helper,
  `public-listing-policy-fix-migration.sql`. Verified live: anon REST
  read of the real unit returns real data, and the actual public
  index.html (served over real HTTP, not a file:// preview — that
  renders as an inert static snapshot, no JS runs) shows it.
- `../Accurate Storage Station/netlify/functions/charge.js` rewritten:
  resolves price/vacancy/Stripe Price ID from Supabase before charging
  (hard-fails if Supabase is down — no safe price to fall back to), then
  best-effort syncs the new tenant/occupied-unit/payment/gate-code/
  activity-log into the dashboard AFTER a successful charge (never blocks
  or fails the customer-facing response — see that file's own comment).
- New `.../netlify/functions/webhook.js` for recurring monthly charges —
  deliberately reuses an already-existing Stripe webhook endpoint
  (`Accurate Storage Webhook`, listening to `invoice.payment_succeeded` +
  `invoice.payment_failed`) rather than asking Callie to create a new
  one; file renamed to `webhook.js` to match that endpoint's existing
  path.
- Real values collected from Callie: Stripe publishable key (now in
  `index.html`), the existing webhook's signing secret. Both tenants.md-
  worthy — see [[accurate-storage-app]] memory for the full list of what's
  still needed in Netlify's env vars before any of this goes live
  end-to-end (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
  STRIPE_WEBHOOK_SECRET — none added yet as of this entry, plus a
  redeploy, since the site is drag-and-drop, not auto-deploying from any
  repo I can push to).

**Not yet done**: real Stripe Price IDs per unit (the org's actual
Stripe Products/Prices don't exist yet — Callie needs to create them),
the Netlify env vars above, and the redeploy itself.

## Status (2026-08-26) — live in production

Deployed and verified end-to-end: signup → org+admin creation → login →
real CRUD, both locally and on `https://accurate-storage.vercel.app`.
Pilot org "Accurate Storage" exists with admin login
`callie@accuratecoloronline.com`.

Infra: GitHub `AccurateColor/Accurate-Storage` (push via a dedicated
deploy key, `~/.ssh/id_ed25519_astorage` / host alias
`github.com-accurate-storage` — added read-only at first, had to be
re-added with write access checked), Supabase project
`awpoiywbzbwlcikoafca` (schema.sql + policies.sql applied), Vercel project
under the "Accurate Color" team.

Two real bugs found and fixed via live testing, not caught by
`build`/`eslint` alone:
1. `BarChart.tsx`'s y-axis labels used the rounded *value* as a React key
   — a brand-new org with $0 revenue rounds several steps to the same
   number, causing a duplicate-key console error. Fixed: index as key
   instead. Caught via the Next.js dev error overlay right after the
   first real signup.
2. The Vercel project's **Framework Preset was "Other" instead of
   "Next.js"** on import — every route 404'd at the platform level
   (`x-vercel-error: NOT_FOUND`) despite `npm run build` succeeding both
   in Vercel's own logs and locally in production mode. Not a code or
   Next.js-version issue (pinning `next`/`eslint-config-next` to 16.3.1,
   matching `../amazing-spaces-app`, was tried first and made no
   difference). Fixed in Settings → Build and Deployment → Framework
   Preset → Next.js, then a fresh deploy. See
   `~/.claude/projects/.../memory/vercel-framework-preset-gotcha.md` for
   the full writeup — check this FIRST on any future "builds fine, 404s
   everywhere" Vercel deployment before suspecting the app.

## Status (2026-08-25) — v1 core scaffolded, not yet connected to a real Supabase project

Built from Claude Design's dashboard handoff
(`../Accurate Storage Station/Accurate Storage Design System.zip`) plus a
richer visual mockup Callie pasted mid-build. Architecture deliberately
copied from `../amazing-spaces-app` (its own README calls itself a
reusable template) with multi-tenancy added: `organizations` is the
tenant, everything else carries `organization_id`, RLS keys off
`current_org_id()`.

Two scope decisions made via clarifying questions before building:
1. **Multi-tenant SaaS, not a single-facility internal tool** — the
   mockup's "Create Your Account / 14-Day Free Trial / Multi-Tenant
   Platform" messaging was literal, not template flavor. Confirmed with
   Callie.
2. Trial signup needs no credit card (v1); tenant rent collection uses
   manually-pasted Stripe keys per organization (Settings), with Stripe
   Connect deferred rather than built now.

**Built**: Dashboard, Units, Leads & Tenants, Payments & Billing,
Delinquency, Gate Access, Settings (Branding, Theme with live per-org
color override, Stripe keys, Team Management), signup (org + admin
creation) and login. `npm run build` and `npx eslint .` both clean.

**Not yet done**:
- Never run against a real Supabase project — schema/policies SQL exist
  (`supabase/schema.sql`, `supabase/policies.sql`) but nothing has been
  applied anywhere yet. **Needs Callie**: create the Supabase project,
  run both SQL files in order, and share the three env values
  (`.env.local.example`) — I can't create a Supabase project or read its
  keys myself.
- No GitHub repo yet — this is a local-only directory. **Needs Callie**:
  create an empty GitHub repo; I can init git and push once one exists.
- Not deployed to Vercel yet — needs the GitHub repo to exist first, then
  a Vercel project pointed at it (Callie's own OAuth, not something I can
  click through for her).
- Stripe webhook (turning a real rental into tenant/payment/gate-code
  rows) not built — no route exists yet, see README's "What's
  deliberately not built yet."
- Public rental site (`../Accurate Storage Station/index.html`, Netlify)
  untouched — still on its own hardcoded unit list, not reading from this
  database.
- SaaS-side billing (charging facility owners after their trial) not
  built — trial countdown shows on the Dashboard, nothing enforces it.
