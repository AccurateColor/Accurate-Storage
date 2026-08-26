@AGENTS.md

# Accurate Storage — Facility Management (Next.js + Supabase)

**This is the active build.** Read README.md first — it covers the stack,
multi-tenancy, security posture, what's built, and what's deliberately
not built yet. This file is just the pointer + a running status log, same
convention `../amazing-spaces-app/CLAUDE.md` uses.

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
