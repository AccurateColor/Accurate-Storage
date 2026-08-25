import { getCurrentUser, hasPermission } from "@/lib/auth/permissions";
import { getTenants, getUnitOptions } from "@/lib/data/tenants";
import { Header } from "@/components/layout/Header";
import { TenantsClient } from "./TenantsClient";

export default async function TenantsPage() {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user, "view_tenants")) return null;
  const [tenants, unitOptions] = await Promise.all([
    getTenants(user.organization.id),
    getUnitOptions(user.organization.id),
  ]);

  return (
    <>
      <Header title="Leads & Tenants" subtitle="Manage leads and tenant information." userName={user.team.name} orgName={user.organization.name} />
      <main className="flex-1 overflow-y-auto">
        <TenantsClient tenants={tenants} unitOptions={unitOptions} canEdit={hasPermission(user, "edit_tenants")} />
      </main>
    </>
  );
}
