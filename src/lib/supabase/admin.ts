import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * The ONE place in this app that uses the `service_role` key — every other
 * Supabase client here (`server.ts` / `client.ts`) uses the anon key plus
 * whichever user's session cookie made the request, so RLS applies exactly
 * as documented in README.md's Security section.
 *
 * Used only where a server-side action genuinely has to act across users/
 * organizations rather than as the current session, or where there is no
 * session at all: creating a new organization + its first admin login at
 * signup (`account-provisioning.ts` — an anonymous signup holds no `team`
 * row yet for RLS to key off of), admin-provisioned team member logins
 * (same file, same reasoning as Amazing Spaces' own admin-set-password
 * flow — Supabase's own confirmation email is not a dependable onboarding
 * path), and the Stripe webhook route (`src/app/api/stripe/webhook/`,
 * which authenticates via the Stripe signature, not a Supabase session,
 * and writes tenant/payment/activity rows on a real rental regardless of
 * which staff member — if any — is logged in at that moment).
 *
 * Never send this key to the browser. Reads from `SUPABASE_SERVICE_ROLE_KEY`
 * — a non-`NEXT_PUBLIC_` env var — which is not set by default; every
 * caller treats a null return as "not configured yet" and degrades
 * gracefully (signup and admin-provisioned logins simply cannot complete
 * without it — see each caller's own error message).
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createSupabaseClient<Database>(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
