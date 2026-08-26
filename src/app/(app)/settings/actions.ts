"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, hasPermission } from "@/lib/auth/permissions";
import { setTeamMemberPassword } from "@/lib/auth/account-provisioning";
import type { PermissionKey } from "@/types/database";

export type ActionState = { error: string | null };

export const ROLE_PERMISSIONS: Record<string, PermissionKey[]> = {
  Admin: ["admin"],
  Manager: [
    "view_units",
    "edit_units",
    "view_tenants",
    "edit_tenants",
    "view_payments",
    "edit_payments",
    "view_delinquency",
    "view_gate_access",
    "edit_gate_access",
    "view_settings",
  ],
  Staff: ["view_units", "view_tenants", "edit_tenants", "view_payments", "edit_payments", "view_delinquency", "view_gate_access", "edit_gate_access"],
};

export async function updateBranding(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user, "admin")) return { error: "Only an admin can update branding." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("organizations")
    .update({
      name: String(formData.get("name") ?? "").trim() || user.organization.name,
      logo_url: String(formData.get("logo_url") ?? "").trim() || null,
      address_line1: String(formData.get("address_line1") ?? "").trim() || null,
      address_line2: String(formData.get("address_line2") ?? "").trim() || null,
      city: String(formData.get("city") ?? "").trim() || null,
      state: String(formData.get("state") ?? "").trim() || null,
      postal_code: String(formData.get("postal_code") ?? "").trim() || null,
    })
    .eq("id", user.organization.id);
  if (error) return { error: error.message };

  revalidatePath("/settings");
  revalidatePath("/");
  return { error: null };
}

export async function updatePublicListing(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user, "admin")) return { error: "Only an admin can change this." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("organizations")
    .update({ public_availability_enabled: formData.get("public_availability_enabled") === "on" })
    .eq("id", user.organization.id);
  if (error) return { error: error.message };

  revalidatePath("/settings");
  return { error: null };
}

export async function updateTheme(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user, "admin")) return { error: "Only an admin can update the theme." };

  const primary = String(formData.get("primary_color") ?? "");
  const accent = String(formData.get("accent_color") ?? "");
  if (!/^#[0-9a-fA-F]{6}$/.test(primary) || !/^#[0-9a-fA-F]{6}$/.test(accent)) {
    return { error: "Colors must be valid hex values." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("organizations")
    .update({ primary_color: primary, accent_color: accent })
    .eq("id", user.organization.id);
  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  return { error: null };
}

export async function updateStripeKeys(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user, "admin")) return { error: "Only an admin can update Stripe keys." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("organizations")
    .update({
      stripe_secret_key: String(formData.get("stripe_secret_key") ?? "").trim() || null,
      stripe_publishable_key: String(formData.get("stripe_publishable_key") ?? "").trim() || null,
    })
    .eq("id", user.organization.id);
  if (error) return { error: error.message };

  revalidatePath("/settings");
  revalidatePath("/");
  return { error: null };
}

export async function addTeamMember(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user, "admin")) return { error: "Only an admin can add team members." };

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const name = String(formData.get("name") ?? "").trim();
  const role = String(formData.get("role") ?? "Staff");
  if (!email || !name) return { error: "Name and email are required." };

  const supabase = await createClient();
  const { data: member, error } = await supabase
    .from("team")
    .insert({ organization_id: user.organization.id, name, email })
    .select()
    .single();
  if (error || !member) {
    return { error: error?.code === "23505" ? "That email is already on the team." : error?.message ?? "Couldn't add team member." };
  }

  const permissions = ROLE_PERMISSIONS[role] ?? ROLE_PERMISSIONS.Staff;
  const { error: permError } = await supabase
    .from("team_permissions")
    .insert(permissions.map((permission_key) => ({ team_id: member.id, permission_key })));
  if (permError) return { error: permError.message };

  revalidatePath("/settings");
  return { error: null };
}

export async function setMemberPassword(teamId: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user, "admin")) return { error: "Only an admin can set a login password." };

  const password = String(formData.get("password") ?? "");
  const result = await setTeamMemberPassword(teamId, password);
  if (!result.ok) return { error: result.error };

  revalidatePath("/settings");
  return { error: null };
}

export async function deactivateTeamMember(teamId: string) {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user, "admin")) return;
  if (teamId === user.team.id) return; // can't deactivate yourself from here

  const supabase = await createClient();
  await supabase.from("team").update({ active: false }).eq("id", teamId).eq("organization_id", user.organization.id);
  revalidatePath("/settings");
}

export async function reactivateTeamMember(teamId: string) {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user, "admin")) return;

  const supabase = await createClient();
  await supabase.from("team").update({ active: true }).eq("id", teamId).eq("organization_id", user.organization.id);
  revalidatePath("/settings");
}
