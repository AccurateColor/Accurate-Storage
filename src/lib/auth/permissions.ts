import { createClient } from "@/lib/supabase/server";
import type { Organization, PermissionKey, Team } from "@/types/database";

export type CurrentUser = {
  team: Team;
  organization: Organization;
  permissions: PermissionKey[];
  isAdmin: boolean;
};

/**
 * Resolves the logged-in Supabase Auth user to their `team` row, that
 * team's `organization`, and granted `team_permissions`. Returns null if
 * there's no session, or if a user is authenticated but has no matching
 * `team` row (e.g. their organization's admin hasn't added them to Team
 * yet, or deactivated them).
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  let team = await findTeamByAuthUserId(supabase, user.id);

  // Self-heal the signup-time link here rather than only at signup: if
  // email confirmation is required, there's no session yet at the moment
  // account-provisioning.ts's createOrganizationWithAdmin runs. This is
  // the first point a real authenticated session exists, so it's the
  // reliable place to claim an admin-created row matching this user's own
  // email — same pattern as the Amazing Spaces build this is based on.
  if (!team && user.email) {
    await supabase
      .from("team")
      .update({ auth_user_id: user.id })
      .is("auth_user_id", null)
      .ilike("email", user.email);
    team = await findTeamByAuthUserId(supabase, user.id);
  }

  if (!team) return null;

  const [{ data: permissionRows }, { data: organization }] = await Promise.all([
    supabase.from("team_permissions").select("permission_key").eq("team_id", team.id),
    supabase.from("organizations").select("*").eq("id", team.organization_id).maybeSingle(),
  ]);

  if (!organization) return null;

  const permissions = (permissionRows ?? []).map((r) => r.permission_key as PermissionKey);

  return { team, organization, permissions, isAdmin: permissions.includes("admin") };
}

export function hasPermission(user: CurrentUser | null, key: PermissionKey): boolean {
  if (!user) return false;
  return user.isAdmin || user.permissions.includes(key);
}

async function findTeamByAuthUserId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  authUserId: string
): Promise<Team | null> {
  const { data } = await supabase
    .from("team")
    .select("*")
    .eq("auth_user_id", authUserId)
    .eq("active", true)
    .maybeSingle();
  return data ?? null;
}
