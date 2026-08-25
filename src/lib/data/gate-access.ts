import { createClient } from "@/lib/supabase/server";
import type { GateCode } from "@/types/database";

export type GateCodeWithRelations = GateCode & {
  tenant: { first_name: string; last_name: string } | null;
  unit: { unit_number: string } | null;
};

export async function getGateCodes(organizationId: string): Promise<GateCodeWithRelations[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("gate_codes")
    .select("*, tenant:tenants(first_name, last_name), unit:units(unit_number)")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });
  return (data ?? []) as unknown as GateCodeWithRelations[];
}
