import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/permissions";
import { getDashboardData } from "@/lib/data/dashboard";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { Sparkline } from "@/components/ui/Sparkline";
import { BarChart } from "@/components/ui/BarChart";
import { DonutChart } from "@/components/ui/DonutChart";
import { StatusChip } from "@/components/ui/StatusChip";

const currency = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const pct = (n: number, total: number) => (total > 0 ? Math.round((n / total) * 100) : 0);

const ACTIVITY_TONE: Record<string, "good" | "bad" | "info" | "neutral"> = {
  lease_signed: "good",
  payment_received: "good",
  payment_failed: "bad",
  gate_code_used: "info",
  lead_received: "info",
};

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  const data = await getDashboardData(user.organization.id);

  return (
    <>
      <Header
        title="Dashboard"
        subtitle="Here's what's happening at your facility today."
        userName={user.team.name}
        orgName={user.organization.name}
        actions={
          <Button variant="secondary" disabled title="Coming soon">
            Customize Dashboard
          </Button>
        }
      />
      <main className="flex-1 overflow-y-auto px-8 py-6">
        {user.organization.plan === "trial" && (
          <div className="mb-6 rounded-lg border border-pink/30 bg-pink-soft px-4 py-2.5 text-sm text-ink">
            You&apos;re on a 14-day free trial, ending{" "}
            {new Date(user.organization.trial_ends_at).toLocaleDateString("en-US", { month: "long", day: "numeric" })}. No
            credit card required to keep exploring.
          </div>
        )}

        {/* Stat cards */}
        <div className="grid grid-cols-4 gap-4">
          <div className="rounded-xl bg-navy-dark p-4 text-white shadow-card">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-white/50">Occupancy</p>
            <p className="mt-1 text-2xl font-bold">{pct(data.occupied, data.totalUnits)}%</p>
            <p className="text-xs text-white/60">
              {data.occupied} / {data.totalUnits} Units
            </p>
          </div>
          <StatCard label="Monthly Revenue" value={currency(data.monthlyRevenue)} data={data.revenueByDay.map((d) => d.value)} />
          <div className="rounded-xl bg-surface p-4 shadow-card">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-faint">New Leads</p>
            <p className="mt-1 text-2xl font-bold text-ink">{data.newLeadsThisWeek}</p>
            <p className="text-xs text-ink-muted">this week</p>
          </div>
          <div className="rounded-xl bg-surface p-4 shadow-card">
            <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-ink-faint">
              Past Due
            </p>
            <p className="mt-1 text-2xl font-bold text-ink">{currency(data.pastDueTotal)}</p>
            <p className="text-xs text-ink-muted">{data.pastDueCount} accounts</p>
            <div className="mt-2">
              <Sparkline data={data.revenueByDay.map((d) => d.value)} color="var(--color-red)" />
            </div>
          </div>
        </div>

        {/* Revenue + unit status */}
        <div className="mt-6 grid grid-cols-[1.4fr_1fr] gap-4">
          <div className="rounded-xl bg-surface p-5 shadow-card">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-bold text-ink">Revenue Overview</h2>
              <span className="text-xs text-ink-muted">Last 14 Days</span>
            </div>
            <p className="text-2xl font-bold text-ink">{currency(data.revenueByDay.reduce((s, d) => s + d.value, 0))}</p>
            <p className="mb-4 text-xs text-ink-muted">Total Collected</p>
            <BarChart data={data.revenueByDay} formatValue={(v) => `$${v >= 1000 ? `${Math.round(v / 1000)}K` : v}`} />
          </div>
          <div className="rounded-xl bg-surface p-5 shadow-card">
            <h2 className="mb-4 text-base font-bold text-ink">Unit Status Overview</h2>
            <div className="flex items-center gap-5">
              <DonutChart
                centerValue={String(data.totalUnits)}
                centerLabel="Total Units"
                segments={[
                  { label: "Occupied", value: data.occupied, color: "var(--color-navy)" },
                  { label: "Available", value: data.vacant, color: "var(--color-pink)" },
                  { label: "Reserved", value: data.reserved, color: "var(--color-amber)" },
                  { label: "Maintenance", value: data.maintenance, color: "var(--color-ink-faint)" },
                ]}
              />
              <div className="space-y-2 text-sm">
                <LegendRow color="var(--color-navy)" label="Occupied" value={data.occupied} total={data.totalUnits} />
                <LegendRow color="var(--color-pink)" label="Available" value={data.vacant} total={data.totalUnits} />
                <LegendRow color="var(--color-amber)" label="Reserved" value={data.reserved} total={data.totalUnits} />
                <LegendRow color="var(--color-ink-faint)" label="Maintenance" value={data.maintenance} total={data.totalUnits} />
              </div>
            </div>
          </div>
        </div>

        {/* Delinquent + side column */}
        <div className="mt-6 grid grid-cols-[1.4fr_1fr] gap-4">
          <div className="rounded-xl bg-surface p-5 shadow-card">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-bold text-ink">Delinquent Accounts</h2>
              <Link href="/delinquency" className="text-xs font-semibold text-pink hover:underline">
                View All
              </Link>
            </div>
            {data.delinquentAccounts.length === 0 ? (
              <EmptyRow text="No delinquent accounts right now." />
            ) : (
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-[11px] uppercase tracking-wide text-ink-faint">
                    <th className="pb-2 font-semibold">Tenant</th>
                    <th className="pb-2 font-semibold">Unit</th>
                    <th className="pb-2 font-semibold">Due Date</th>
                    <th className="pb-2 font-semibold">Balance</th>
                    <th className="pb-2 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.delinquentAccounts.map((d) => (
                    <tr key={d.id} className="border-t border-line">
                      <td className="py-2.5">{d.tenantName}</td>
                      <td className="py-2.5">{d.unitNumber}</td>
                      <td className="py-2.5">{new Date(d.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</td>
                      <td className="py-2.5">{currency(d.amount)}</td>
                      <td className="py-2.5">
                        <StatusChip
                          tone={d.daysLate === 0 ? "warn" : "bad"}
                          label={d.daysLate === 0 ? "Today" : `${d.daysLate} Day${d.daysLate === 1 ? "" : "s"} Late`}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="space-y-4">
            <div className="rounded-xl bg-surface p-5 shadow-card">
              <h2 className="mb-3 text-base font-bold text-ink">Recent Activity</h2>
              {data.recentActivity.length === 0 ? (
                <EmptyRow text="Nothing yet — activity shows up here as it happens." />
              ) : (
                <ul className="space-y-3">
                  {data.recentActivity.map((a) => (
                    <li key={a.id} className="flex items-start gap-2">
                      <span
                        className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{
                          background: `var(--color-${ACTIVITY_TONE[a.type] === "good" ? "green" : ACTIVITY_TONE[a.type] === "bad" ? "red" : "navy"})`,
                        }}
                      />
                      <div className="min-w-0">
                        <p className="truncate text-sm text-ink">{a.message}</p>
                        <p className="text-[11px] text-ink-faint">{new Date(a.created_at).toLocaleString()}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-xl bg-surface p-5 shadow-card">
              <h2 className="mb-3 text-base font-bold text-ink">Upcoming Reminders</h2>
              {data.upcomingPayments.length === 0 && data.leasesEndingSoon.length === 0 ? (
                <EmptyRow text="Nothing due in the next week." />
              ) : (
                <ul className="space-y-3 text-sm">
                  {data.upcomingPayments.map((p) => (
                    <li key={p.id}>
                      <p className="text-ink">Payment due {new Date(p.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p>
                      <p className="text-[11px] text-ink-faint">{currency(Number(p.amount))} — Unit {p.units?.unit_number ?? "—"}</p>
                    </li>
                  ))}
                  {data.leasesEndingSoon.map((t) => (
                    <li key={t.id}>
                      <p className="text-ink">
                        Lease ending {new Date(t.lease_end).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </p>
                      <p className="text-[11px] text-ink-faint">
                        {t.first_name} {t.last_name} — Unit {t.units?.unit_number ?? "—"}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-xl bg-surface p-5 shadow-card">
              <h2 className="mb-3 text-base font-bold text-ink">Quick Actions</h2>
              <div className="grid grid-cols-3 gap-2">
                <QuickAction href="/tenants" label="Add Lead" icon="tenants" />
                <QuickAction href="/tenants" label="Add Tenant" icon="tenants" />
                <QuickAction href="/units" label="Add Unit" icon="units" />
                <QuickAction href="/gate-access" label="Add Code" icon="gate" />
                <QuickAction href="/payments" label="Record Payment" icon="payments" />
                <QuickAction href="#" label="Create Task" icon="tasks" soon />
              </div>
            </div>
          </div>
        </div>

        {/* Integrations */}
        <div className="mt-6 rounded-xl bg-surface p-5 shadow-card">
          <h2 className="mb-4 text-base font-bold text-ink">Connect Your Tools</h2>
          <div className="grid grid-cols-4 gap-4">
            <IntegrationTile name="Stripe" desc="Collect rent from your tenants" status={user.organization.stripe_secret_key ? "Configured" : undefined} href="/settings" />
            <IntegrationTile name="QuickBooks" desc="Sync invoices & payments" />
            <IntegrationTile name="Google Workspace" desc="Sync Gmail, Calendar & Drive" />
            <IntegrationTile name="Twilio (SMS)" desc="Reminders & alerts via text" />
          </div>
        </div>
      </main>
    </>
  );
}

function StatCard({ label, value, sub, data }: { label: string; value: string; sub?: string; data: number[] }) {
  return (
    <div className="rounded-xl bg-surface p-4 shadow-card">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-faint">{label}</p>
      <p className="mt-1 text-2xl font-bold text-ink">{value}</p>
      {sub && <p className="text-xs text-ink-muted">{sub}</p>}
      <div className="mt-2">
        <Sparkline data={data.length ? data : [0, 0]} />
      </div>
    </div>
  );
}

function LegendRow({ color, label, value, total }: { color: string; label: string; value: number; total: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
      <span className="text-ink-muted">{label}</span>
      <span className="ml-auto font-semibold text-ink">
        {value} ({pct(value, total)}%)
      </span>
    </div>
  );
}

function EmptyRow({ text }: { text: string }) {
  return <p className="py-6 text-center text-sm text-ink-faint">{text}</p>;
}

function QuickAction({ href, label, icon, soon }: { href: string; label: string; icon: string; soon?: boolean }) {
  const content = (
    <div className={`flex flex-col items-center gap-1.5 rounded-lg border border-line p-3 text-center ${soon ? "opacity-40" : "hover:border-pink hover:bg-pink-soft"}`}>
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-navy-soft text-navy">
        <QAIcon name={icon} />
      </span>
      <span className="text-[11px] font-medium text-ink">{label}</span>
    </div>
  );
  if (soon) return <div title="Coming soon">{content}</div>;
  return <Link href={href}>{content}</Link>;
}

function QAIcon({ name }: { name: string }) {
  const paths: Record<string, string> = {
    tenants: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8a7 7 0 0 1 14 0",
    units: "M12 4v16m-8-8h16",
    gate: "M6 10V7a6 6 0 0 1 12 0v3M5 10h14v10H5V10Z",
    payments: "M3 7h18v12H3V7Zm0 4h18",
    tasks: "M9 11l3 3 5-5",
  };
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d={paths[name] ?? paths.units} />
    </svg>
  );
}

function IntegrationTile({ name, desc, status, href }: { name: string; desc: string; status?: string; href?: string }) {
  return (
    <div className="rounded-lg border border-line p-4">
      <p className="text-sm font-semibold text-ink">{name}</p>
      <p className="mt-0.5 text-xs text-ink-muted">{desc}</p>
      {status ? (
        <StatusChip tone="good" label={status} className="mt-2" />
      ) : href ? (
        <Link href={href} className="mt-2 inline-block text-xs font-semibold text-pink hover:underline">
          Connect
        </Link>
      ) : (
        <span className="mt-2 inline-block text-xs font-semibold text-ink-faint">Coming soon</span>
      )}
    </div>
  );
}
