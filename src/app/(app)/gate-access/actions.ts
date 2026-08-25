"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, hasPermission } from "@/lib/auth/permissions";

export type ActionState = { error: string | null };

export async function createGateCode(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user, "edit_gate_access")) return { error: "You don't have permission to manage gate access." };

  const label = String(formData.get("label") ?? "").trim();
  const code = String(formData.get("code") ?? "").trim();
  if (!label || !code) return { error: "Label and code are required." };

  const fields = {
    label,
    code,
    tenant_id: String(formData.get("tenant_id") ?? "") || null,
    unit_id: String(formData.get("unit_id") ?? "") || null,
    vehicle_plate: String(formData.get("vehicle_plate") ?? "").trim() || null,
    access_level: String(formData.get("access_level") ?? "tenant") as "tenant" | "staff" | "visitor" | "vendor",
    expires_at: String(formData.get("expires_at") ?? "") || null,
  };

  const supabase = await createClient();
  const { error } = await supabase.from("gate_codes").insert({ organization_id: user.organization.id, ...fields });
  if (error) return { error: error.message };

  revalidatePath("/gate-access");
  return { error: null };
}

export async function toggleGateCodeActive(gateCodeId: string, active: boolean) {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user, "edit_gate_access")) return;

  const supabase = await createClient();
  await supabase.from("gate_codes").update({ active }).eq("id", gateCodeId).eq("organization_id", user.organization.id);
  revalidatePath("/gate-access");
}

export async function deleteGateCode(gateCodeId: string) {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user, "edit_gate_access")) return;

  const supabase = await createClient();
  await supabase.from("gate_codes").delete().eq("id", gateCodeId).eq("organization_id", user.organization.id);
  revalidatePath("/gate-access");
}
