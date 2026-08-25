import { createClient } from "@/lib/supabase/server";

export type DelinquentAccount = {
  id: string;
  amount: number;
  due_date: string;
  daysLate: number;
  tenant: { id: string; first_name: string; last_name: string; email: string | null; phone: string | null } | null;
  unit: { unit_number: string } | null;
};

/** Delinquency has no table of its own — it's payments.status = 'late', joined for display. */
export async function getDelinquentAccounts(organizationId: string): Promise<DelinquentAccount[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("payments")
    .select("id, amount, due_date, tenant:tenants(id, first_name, last_name, email, phone), unit:units(unit_number)")
    .eq("organization_id", organizationId)
    .eq("status", "late")
    .order("due_date", { ascending: true });

  const now = Date.now();
  return ((data ?? []) as unknown as Omit<DelinquentAccount, "daysLate">[]).map((p) => ({
    ...p,
    daysLate: Math.max(0, Math.floor((now - new Date(p.due_date).getTime()) / 86_400_000)),
  }));
}
