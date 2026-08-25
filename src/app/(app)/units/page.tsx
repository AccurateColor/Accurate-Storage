import { getCurrentUser, hasPermission } from "@/lib/auth/permissions";
import { getUnits } from "@/lib/data/units";
import { Header } from "@/components/layout/Header";
import { UnitsClient } from "./UnitsClient";

export default async function UnitsPage() {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user, "view_units")) return null;
  const units = await getUnits(user.organization.id);

  return (
    <>
      <Header title="Units" subtitle="Manage your unit inventory and rates." userName={user.team.name} orgName={user.organization.name} />
      <main className="flex-1 overflow-y-auto">
        <UnitsClient units={units} canEdit={hasPermission(user, "edit_units")} />
      </main>
    </>
  );
}
