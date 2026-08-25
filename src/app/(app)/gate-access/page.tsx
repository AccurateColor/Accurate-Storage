import { getCurrentUser, hasPermission } from "@/lib/auth/permissions";
import { getGateCodes } from "@/lib/data/gate-access";
import { getUnitOptions } from "@/lib/data/tenants";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/Header";
import { GateAccessClient } from "./GateAccessClient";

export default async function GateAccessPage() {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user, "view_gate_access")) return null;

  const supabase = await createClient();
  const [codes, units, { data: tenants }] = await Promise.all([
    getGateCodes(user.organization.id),
    getUnitOptions(user.organization.id),
    supabase.from("tenants").select("id, first_name, last_name").eq("organization_id", user.organization.id).order("first_name"),
  ]);

  return (
    <>
      <Header title="Gate Access" subtitle="Manage vehicle and visitor gate access." userName={user.team.name} orgName={user.organization.name} />
      <main className="flex-1 overflow-y-auto">
        <GateAccessClient codes={codes} tenants={tenants ?? []} units={units} canEdit={hasPermission(user, "edit_gate_access")} />
      </main>
    </>
  );
}
