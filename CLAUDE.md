@AGENTS.md

# Accurate Storage — Facility Management (Next.js + Supabase)

**This is the active build.** Read README.md first — it covers the stack,
multi-tenancy, security posture, what's built, and what's deliberately
not built yet. This file is just the pointer + a running status log, same
convention `../amazing-spaces-app/CLAUDE.md` uses.

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
