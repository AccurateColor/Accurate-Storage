"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, hasPermission } from "@/lib/auth/permissions";

export type ActionState = { error: string | null };

function parseTenantForm(formData: FormData) {
  return {
    first_name: String(formData.get("first_name") ?? "").trim(),
    last_name: String(formData.get("last_name") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim() || null,
    phone: String(formData.get("phone") ?? "").trim() || null,
    status: String(formData.get("status") ?? "lead") as "lead" | "active" | "past" | "delinquent",
    unit_id: String(formData.get("unit_id") ?? "") || null,
    lease_start: String(formData.get("lease_start") ?? "") || null,
    lease_end: String(formData.get("lease_end") ?? "") || null,
    source: String(formData.get("source") ?? "").trim() || null,
    notes: String(formData.get("notes") ?? "").trim() || null,
    stripe_subscription_id: String(formData.get("stripe_subscription_id") ?? "").trim() || null,
  };
}

/** Keeps units.status in sync with which unit (if any) a tenant currently occupies. */
async function syncUnitOccupancy(
  supabase: Awaited<ReturnType<typeof createClient>>,
  organizationId: string,
  previousUnitId: string | null,
  fields: ReturnType<typeof parseTenantForm>
) {
  if (previousUnitId && previousUnitId !== fields.unit_id) {
    await supabase
      .from("units")
      .update({ status: "vacant" })
      .eq("id", previousUnitId)
      .eq("organization_id", organizationId)
      .eq("status", "occupied");
  }
  if (fields.unit_id) {
    const occupies = fields.status === "active" || fields.status === "delinquent";
    await supabase
      .from("units")
      .update({ status: occupies ? "occupied" : "vacant" })
      .eq("id", fields.unit_id)
      .eq("organization_id", organizationId);
  }
}

export async function createTenant(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user, "edit_tenants")) return { error: "You don't have permission to add tenants." };

  const fields = parseTenantForm(formData);
  if (!fields.first_name || !fields.last_name) return { error: "First and last name are required." };

  const supabase = await createClient();
  const { data: tenant, error } = await supabase
    .from("tenants")
    .insert({ organization_id: user.organization.id, ...fields })
    .select()
    .single();
  if (error || !tenant) {
    return {
      error:
        error?.code === "23505"
          ? "That Stripe Subscription ID is already linked to another tenant."
          : error?.message ?? "Couldn't create tenant.",
    };
  }

  await syncUnitOccupancy(supabase, user.organization.id, null, fields);

  if (fields.status === "active") {
    await supabase.from("activity_log").insert({
      organization_id: user.organization.id,
      type: "lease_signed",
      message: `New lease signed: ${fields.first_name} ${fields.last_name}`,
      tenant_id: tenant.id,
      unit_id: fields.unit_id,
    });
  } else if (fields.status === "lead") {
    await supabase.from("activity_log").insert({
      organization_id: user.organization.id,
      type: "lead_received",
      message: `New lead received: ${fields.first_name} ${fields.last_name}`,
      tenant_id: tenant.id,
    });
  }

  revalidatePath("/tenants");
  revalidatePath("/units");
  revalidatePath("/");
  return { error: null };
}

export async function updateTenant(tenantId: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user, "edit_tenants")) return { error: "You don't have permission to edit tenants." };

  const fields = parseTenantForm(formData);
  if (!fields.first_name || !fields.last_name) return { error: "First and last name are required." };

  const supabase = await createClient();
  const { data: existing } = await supabase.from("tenants").select("unit_id").eq("id", tenantId).maybeSingle();

  const { error } = await supabase
    .from("tenants")
    .update(fields)
    .eq("id", tenantId)
    .eq("organization_id", user.organization.id);
  if (error) {
    return {
      error:
        error.code === "23505"
          ? "That Stripe Subscription ID is already linked to another tenant."
          : error.message,
    };
  }

  await syncUnitOccupancy(supabase, user.organization.id, existing?.unit_id ?? null, fields);

  revalidatePath("/tenants");
  revalidatePath("/units");
  revalidatePath("/");
  return { error: null };
}

export async function deleteTenant(tenantId: string) {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user, "edit_tenants")) return;

  const supabase = await createClient();
  const { data: existing } = await supabase.from("tenants").select("unit_id").eq("id", tenantId).maybeSingle();
  await supabase.from("tenants").delete().eq("id", tenantId).eq("organization_id", user.organization.id);
  if (existing?.unit_id) {
    await supabase
      .from("units")
      .update({ status: "vacant" })
      .eq("id", existing.unit_id)
      .eq("organization_id", user.organization.id)
      .eq("status", "occupied");
  }
  revalidatePath("/tenants");
  revalidatePath("/units");
  revalidatePath("/");
}
