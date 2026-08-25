import { createClient } from "@/lib/supabase/server";
import type { Payment, Tenant, Unit } from "@/types/database";

export type PaymentWithRelations = Payment & {
  tenant: Pick<Tenant, "id" | "first_name" | "last_name"> | null;
  unit: Pick<Unit, "id" | "unit_number"> | null;
};

export async function getPayments(organizationId: string): Promise<PaymentWithRelations[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("payments")
    .select("*, tenant:tenants(id, first_name, last_name), unit:units(id, unit_number)")
    .eq("organization_id", organizationId)
    .order("due_date", { ascending: false });
  return (data ?? []) as unknown as PaymentWithRelations[];
}

export async function getBillableTenants(
  organizationId: string
): Promise<(Pick<Tenant, "id" | "first_name" | "last_name" | "unit_id"> & { unit: Pick<Unit, "unit_number"> | null })[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tenants")
    .select("id, first_name, last_name, unit_id, unit:units(unit_number)")
    .eq("organization_id", organizationId)
    .in("status", ["active", "delinquent"])
    .order("first_name");
  return (data ?? []) as unknown as (Pick<Tenant, "id" | "first_name" | "last_name" | "unit_id"> & {
    unit: Pick<Unit, "unit_number"> | null;
  })[];
}
