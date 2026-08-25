import { createClient } from "@/lib/supabase/server";
import type { Unit } from "@/types/database";

export type UnitWithTenant = Unit & { tenant: { id: string; first_name: string; last_name: string } | null };

export async function getUnits(organizationId: string): Promise<UnitWithTenant[]> {
  const supabase = await createClient();
  const [{ data: units }, { data: tenants }] = await Promise.all([
    supabase.from("units").select("*").eq("organization_id", organizationId).order("unit_number"),
    supabase
      .from("tenants")
      .select("id, first_name, last_name, unit_id")
      .eq("organization_id", organizationId)
      .in("status", ["active", "delinquent"]),
  ]);

  const tenantByUnit = new Map((tenants ?? []).filter((t) => t.unit_id).map((t) => [t.unit_id as string, t]));

  return (units ?? []).map((u) => ({ ...u, tenant: tenantByUnit.get(u.id) ?? null }));
}
