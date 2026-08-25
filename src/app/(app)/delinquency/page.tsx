import { getCurrentUser, hasPermission } from "@/lib/auth/permissions";
import { getDelinquentAccounts } from "@/lib/data/delinquency";
import { Header } from "@/components/layout/Header";
import { DelinquencyClient } from "./DelinquencyClient";

export default async function DelinquencyPage() {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user, "view_delinquency")) return null;
  const accounts = await getDelinquentAccounts(user.organization.id);

  return (
    <>
      <Header title="Delinquency" subtitle="Accounts past due, worst first." userName={user.team.name} orgName={user.organization.name} />
      <main className="flex-1 overflow-y-auto">
        <DelinquencyClient accounts={accounts} canEdit={hasPermission(user, "edit_payments")} />
      </main>
    </>
  );
}
