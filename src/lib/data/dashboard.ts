import { createClient } from "@/lib/supabase/server";

export type DashboardData = Awaited<ReturnType<typeof getDashboardData>>;

/**
 * Every number here comes from a real (possibly empty) query — a brand-new
 * organization sees honest zeros, not the sample numbers from the design
 * mockup. Unit/payment volumes are small per facility (hundreds, not
 * millions of rows), so counts/sums are computed in JS after a plain
 * `select` rather than via Postgres aggregate RPCs — simpler, and fast
 * enough at this scale.
 */
export async function getDashboardData(organizationId: string) {
  const supabase = await createClient();
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(now.getTime() - 13 * 24 * 60 * 60 * 1000);
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const [unitsRes, paymentsRes, leadsRes, activityRes, leaseEndingRes] = await Promise.all([
    supabase.from("units").select("id, status, monthly_rate").eq("organization_id", organizationId),
    supabase
      .from("payments")
      .select("id, amount, due_date, paid_date, status, tenant_id, unit_id, tenants(first_name,last_name), units(unit_number)")
      .eq("organization_id", organizationId)
      .order("due_date", { ascending: true }),
    supabase
      .from("tenants")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("status", "lead")
      .gte("created_at", weekAgo.toISOString()),
    supabase
      .from("activity_log")
      .select("id, type, message, created_at")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("tenants")
      .select("id, first_name, last_name, unit_id, lease_end, units(unit_number)")
      .eq("organization_id", organizationId)
      .eq("status", "active")
      .not("lease_end", "is", null)
      .lte("lease_end", in30Days.toISOString().slice(0, 10))
      .order("lease_end", { ascending: true })
      .limit(5),
  ]);

  const units = unitsRes.data ?? [];
  const totalUnits = units.length;
  const occupied = units.filter((u) => u.status === "occupied").length;
  const vacant = units.filter((u) => u.status === "vacant").length;
  const reserved = units.filter((u) => u.status === "reserved").length;
  const maintenance = units.filter((u) => u.status === "maintenance").length;

  type PaymentRow = {
    id: string;
    amount: number;
    due_date: string;
    paid_date: string | null;
    status: "paid" | "due" | "late";
    tenant_id: string;
    unit_id: string | null;
    tenants: { first_name: string; last_name: string } | null;
    units: { unit_number: string } | null;
  };
  const payments = (paymentsRes.data ?? []) as unknown as PaymentRow[];

  const monthlyRevenue = payments
    .filter((p) => p.status === "paid" && p.paid_date && new Date(p.paid_date) >= startOfMonth)
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const latePayments = payments.filter((p) => p.status === "late");
  const pastDueTotal = latePayments.reduce((sum, p) => sum + Number(p.amount), 0);

  const revenueByDay: { label: string; value: number }[] = [];
  for (let d = new Date(fourteenDaysAgo); d <= now; d.setDate(d.getDate() + 1)) {
    const key = d.toISOString().slice(0, 10);
    const dayTotal = payments
      .filter((p) => p.status === "paid" && p.paid_date === key)
      .reduce((sum, p) => sum + Number(p.amount), 0);
    revenueByDay.push({ label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }), value: dayTotal });
  }

  const delinquentAccounts = latePayments
    .map((p) => ({
      id: p.id,
      tenantName: p.tenants ? `${p.tenants.first_name} ${p.tenants.last_name}` : "—",
      unitNumber: p.units?.unit_number ?? "—",
      dueDate: p.due_date,
      amount: Number(p.amount),
      daysLate: Math.max(0, Math.floor((now.getTime() - new Date(p.due_date).getTime()) / 86_400_000)),
    }))
    .sort((a, b) => b.daysLate - a.daysLate)
    .slice(0, 5);

  const upcomingPayments = payments
    .filter((p) => p.status === "due" && new Date(p.due_date) <= in7Days && new Date(p.due_date) >= now)
    .slice(0, 5);

  return {
    totalUnits,
    occupied,
    vacant,
    reserved,
    maintenance,
    monthlyRevenue,
    newLeadsThisWeek: leadsRes.count ?? 0,
    pastDueTotal,
    pastDueCount: latePayments.length,
    revenueByDay,
    delinquentAccounts,
    upcomingPayments,
    leasesEndingSoon: (leaseEndingRes.data ?? []) as unknown as {
      id: string;
      first_name: string;
      last_name: string;
      lease_end: string;
      units: { unit_number: string } | null;
    }[],
    recentActivity: activityRes.data ?? [],
  };
}
