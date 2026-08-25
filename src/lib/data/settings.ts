import { createClient } from "@/lib/supabase/server";
import type { PermissionKey, Team } from "@/types/database";

export type TeamMemberWithPermissions = Team & { permissions: PermissionKey[]; hasLogin: boolean };

export async function getTeamMembers(organizationId: string): Promise<TeamMemberWithPermissions[]> {
  const supabase = await createClient();
  const { data: team } = await supabase
    .from("team")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at");
  if (!team || team.length === 0) return [];

  const { data: permissionRows } = await supabase
    .from("team_permissions")
    .select("team_id, permission_key")
    .in("team_id", team.map((t) => t.id));

  return team.map((t) => ({
    ...t,
    hasLogin: !!t.auth_user_id,
    permissions: (permissionRows ?? [])
      .filter((p) => p.team_id === t.id)
      .map((p) => p.permission_key as PermissionKey),
  }));
}
