import { getCurrentUser, hasPermission } from "@/lib/auth/permissions";
import { getTeamMembers } from "@/lib/data/settings";
import { Header } from "@/components/layout/Header";
import { SettingsClient } from "./SettingsClient";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  const team = await getTeamMembers(user.organization.id);

  return (
    <>
      <Header title="Settings" subtitle="Configure your dashboard, branding, and account." userName={user.team.name} orgName={user.organization.name} />
      <main className="flex-1 overflow-y-auto">
        <SettingsClient organization={user.organization} team={team} isAdmin={hasPermission(user, "admin")} />
      </main>
    </>
  );
}
