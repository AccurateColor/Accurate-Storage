import { getCurrentUser, hasPermission } from "@/lib/auth/permissions";
import { getBillableTenants, getPayments } from "@/lib/data/payments";
import { Header } from "@/components/layout/Header";
import { PaymentsClient } from "./PaymentsClient";

export default async function PaymentsPage() {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user, "view_payments")) return null;
  const [payments, billableTenants] = await Promise.all([
    getPayments(user.organization.id),
    getBillableTenants(user.organization.id),
  ]);

  return (
    <>
      <Header title="Payments & Billing" subtitle="Track payments and billing information." userName={user.team.name} orgName={user.organization.name} />
      <main className="flex-1 overflow-y-auto">
        <PaymentsClient payments={payments} billableTenants={billableTenants} canEdit={hasPermission(user, "edit_payments")} />
      </main>
    </>
  );
}
