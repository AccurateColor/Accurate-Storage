import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type ProvisionResult = { ok: true } | { ok: false; error: string };

/**
 * Self-serve trial signup: creates a brand-new `organizations` row, a real
 * Supabase Auth login, and the `team` row linking them — all in one shot,
 * with `email_confirm: true` so there's no wait on Supabase's own
 * confirmation email (unreliable enough on the free tier that Amazing
 * Spaces' admin-provisioned-login pattern exists for the exact same
 * reason — see that app's account-provisioning.ts). No credit card is
 * collected here; `organizations.trial_ends_at` defaults to 14 days out
 * at the database level (schema.sql) and Settings/billing enforcement is
 * a deliberate fast-follow, not part of this v1 flow.
 *
 * Uses the service_role admin client because at the moment this runs
 * there is no session yet for RLS to key off of — this is exactly the
 * "no session at all" case `admin.ts`'s own comment describes.
 */
export async function createOrganizationWithAdmin(params: {
  organizationName: string;
  adminName: string;
  email: string;
  password: string;
}): Promise<ProvisionResult> {
  const { organizationName, adminName, email, password } = params;
  if (password.length < 8) return { ok: false, error: "Password must be at least 8 characters." };

  const admin = createAdminClient();
  if (!admin) {
    return { ok: false, error: "Signup isn't configured yet — SUPABASE_SERVICE_ROLE_KEY is missing." };
  }

  const { data: created, error: createUserError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (createUserError) {
    return { ok: false, error: createUserError.message };
  }
  const authUserId = created.user?.id;
  if (!authUserId) return { ok: false, error: "Couldn't create a login — no user returned." };

  const slug = await uniqueSlug(admin, organizationName);

  const { data: organization, error: orgError } = await admin
    .from("organizations")
    .insert({ name: organizationName, slug })
    .select()
    .single();
  if (orgError || !organization) {
    // Roll back the auth user so a failed signup doesn't leave an orphaned
    // login with no organization/team behind it — a retry with the same
    // email would otherwise fail with "already registered" forever.
    await admin.auth.admin.deleteUser(authUserId);
    return { ok: false, error: orgError?.message ?? "Couldn't create organization." };
  }

  const { data: team, error: teamError } = await admin
    .from("team")
    .insert({
      organization_id: organization.id,
      auth_user_id: authUserId,
      name: adminName,
      email,
    })
    .select()
    .single();
  if (teamError || !team) {
    await admin.auth.admin.deleteUser(authUserId);
    await admin.from("organizations").delete().eq("id", organization.id);
    return { ok: false, error: teamError?.message ?? "Couldn't create team record." };
  }

  const { error: permError } = await admin
    .from("team_permissions")
    .insert({ team_id: team.id, permission_key: "admin" });
  if (permError) {
    return { ok: false, error: permError.message };
  }

  return { ok: true };
}

async function uniqueSlug(
  admin: NonNullable<ReturnType<typeof createAdminClient>>,
  name: string
): Promise<string> {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "facility";

  for (let attempt = 0; attempt < 20; attempt++) {
    const candidate = attempt === 0 ? base : `${base}-${attempt + 1}`;
    const { data } = await admin.from("organizations").select("id").eq("slug", candidate).maybeSingle();
    if (!data) return candidate;
  }
  return `${base}-${Date.now()}`;
}

/**
 * Admin-only: creates a team member's `auth.users` login on first use (or
 * just updates the password if they already have one), same pattern as
 * `createOrganizationWithAdmin` above and Amazing Spaces'
 * `ensureAuthAccount`. Used from Settings' "Add Team Member" flow after
 * the `team` row + permissions already exist — an admin sets the initial
 * password and hands it to the new hire directly, rather than depending
 * on Supabase's own invite/confirmation email.
 */
export async function setTeamMemberPassword(teamId: string, password: string): Promise<ProvisionResult> {
  if (password.length < 8) return { ok: false, error: "Password must be at least 8 characters." };

  const admin = createAdminClient();
  if (!admin) {
    return { ok: false, error: "Not configured — SUPABASE_SERVICE_ROLE_KEY is missing." };
  }

  const supabase = await createClient();
  const { data: member, error: memberError } = await supabase
    .from("team")
    .select("id, email, auth_user_id")
    .eq("id", teamId)
    .maybeSingle();
  if (memberError) return { ok: false, error: memberError.message };
  if (!member) return { ok: false, error: "Team member not found." };

  if (member.auth_user_id) {
    const { error } = await admin.auth.admin.updateUserById(member.auth_user_id, { password });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  }

  const { data: created, error } = await admin.auth.admin.createUser({
    email: member.email,
    password,
    email_confirm: true,
  });
  if (error) {
    return {
      ok: false,
      error: `Couldn't create a login for ${member.email}: ${error.message}.`,
    };
  }
  const authUserId = created.user?.id;
  if (!authUserId) return { ok: false, error: "Couldn't create a login — no user returned." };

  const { error: linkError } = await supabase
    .from("team")
    .update({ auth_user_id: authUserId })
    .eq("id", teamId);
  if (linkError) return { ok: false, error: linkError.message };

  return { ok: true };
}
