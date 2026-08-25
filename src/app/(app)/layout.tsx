import { getCurrentUser } from "@/lib/auth/permissions";
import { Sidebar, type NavItem } from "@/components/layout/Sidebar";

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Dashboard", icon: "dashboard" },
  { href: "/tenants", label: "Leads & Tenants", icon: "tenants" },
  { href: "/units", label: "Units", icon: "units" },
  { href: "/payments", label: "Payments & Billing", icon: "payments" },
  { href: "/delinquency", label: "Delinquency", icon: "delinquency" },
  { href: "/gate-access", label: "Gate Access", icon: "gate" },
  { label: "Automation", icon: "automation", soon: true },
  { label: "Contacts", icon: "contacts", soon: true },
  { label: "Tasks & Reminders", icon: "tasks", soon: true },
  { label: "Reports", icon: "reports", soon: true },
  { label: "Marketing & Social", icon: "marketing", soon: true },
  { label: "Documents", icon: "documents", soon: true },
  { href: "/settings", label: "Settings", icon: "settings" },
];

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  // Middleware already requires a Supabase Auth session for this route
  // group; this only handles the "authenticated but no team row yet"
  // case — e.g. someone was removed from Team, or their invite hasn't
  // been claimed.
  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper px-4">
        <div className="max-w-sm text-center">
          <h1 className="text-lg font-semibold text-ink">No access yet</h1>
          <p className="mt-2 text-sm text-ink-muted">
            You&apos;re signed in, but there&apos;s no active team record linked to your
            account for this facility.
          </p>
          <a href="/login" className="mt-4 inline-block text-sm font-medium text-ink underline">
            Back to login
          </a>
        </div>
      </div>
    );
  }

  const { organization } = user;
  // Per-organization branding override (Settings > Branding). A plain
  // higher-specificity `html:root` rule wins over Tailwind's own bare
  // `:root` regardless of stylesheet order — see globals.css's own
  // comment on why the color @theme block is NOT `inline`.
  const themeStyle = (
    <style id="theme-overrides">{`html:root{--color-navy:${organization.primary_color};--color-pink:${organization.accent_color};}`}</style>
  );

  return (
    <div className="flex min-h-screen bg-paper">
      {themeStyle}
      <Sidebar items={NAV_ITEMS} orgName={organization.name} logoUrl={organization.logo_url} />
      <div className="flex min-h-screen flex-1 flex-col overflow-x-hidden">{children}</div>
    </div>
  );
}
