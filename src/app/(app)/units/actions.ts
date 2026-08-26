"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, hasPermission } from "@/lib/auth/permissions";

export type ActionState = { error: string | null };

function parseUnitForm(formData: FormData) {
  return {
    unit_number: String(formData.get("unit_number") ?? "").trim(),
    size: String(formData.get("size") ?? "").trim() || null,
    square_footage: formData.get("square_footage") ? Number(formData.get("square_footage")) : null,
    monthly_rate: Number(formData.get("monthly_rate") ?? 0),
    status: String(formData.get("status") ?? "vacant") as "vacant" | "occupied" | "reserved" | "maintenance",
    stripe_price_id: String(formData.get("stripe_price_id") ?? "").trim() || null,
    notes: String(formData.get("notes") ?? "").trim() || null,
  };
}

export async function createUnit(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user, "edit_units")) return { error: "You don't have permission to add units." };

  const fields = parseUnitForm(formData);
  if (!fields.unit_number) return { error: "Unit number is required." };

  const supabase = await createClient();
  const { error } = await supabase.from("units").insert({ organization_id: user.organization.id, ...fields });
  if (error) return { error: error.code === "23505" ? "A unit with that number already exists." : error.message };

  revalidatePath("/units");
  revalidatePath("/");
  return { error: null };
}

export async function updateUnit(unitId: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user, "edit_units")) return { error: "You don't have permission to edit units." };

  const fields = parseUnitForm(formData);
  if (!fields.unit_number) return { error: "Unit number is required." };

  const supabase = await createClient();
  const { error } = await supabase.from("units").update(fields).eq("id", unitId).eq("organization_id", user.organization.id);
  if (error) return { error: error.message };

  revalidatePath("/units");
  revalidatePath("/");
  return { error: null };
}

export async function deleteUnit(unitId: string) {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user, "edit_units")) return;

  const supabase = await createClient();
  await supabase.from("units").delete().eq("id", unitId).eq("organization_id", user.organization.id);
  revalidatePath("/units");
  revalidatePath("/");
}
