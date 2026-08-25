import { createClient } from "@/lib/supabase/server";
import type { Tenant, Unit } from "@/types/database";

export type TenantWithUnit = Tenant & { unit: Pick<Unit, "id" | "unit_number"> | null };

export async function getTenants(organizationId: string): Promise<TenantWithUnit[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tenants")
    .select("*, unit:units(id, unit_number)")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });
  return (data ?? []) as unknown as TenantWithUnit[];
}

export async function getUnitOptions(organizationId: string): Promise<Pick<Unit, "id" | "unit_number" | "status">[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("units")
    .select("id, unit_number, status")
    .eq("organization_id", organizationId)
    .order("unit_number");
  return data ?? [];
}
