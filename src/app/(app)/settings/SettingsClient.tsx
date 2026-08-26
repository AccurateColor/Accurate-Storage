"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import {
  addTeamMember,
  deactivateTeamMember,
  reactivateTeamMember,
  setMemberPassword,
  updateBranding,
  updatePublicListing,
  updateStripeKeys,
  updateTheme,
  type ActionState,
} from "./actions";
import type { Organization } from "@/types/database";
import type { TeamMemberWithPermissions } from "@/lib/data/settings";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input, Label, Select, FormRow } from "@/components/ui/Field";
import { StatusChip } from "@/components/ui/StatusChip";

const initialState: ActionState = { error: null };

const PRESETS = [
  { name: "Navy & Pink", primary: "#1D3557", accent: "#E8175D" },
  { name: "Forest & Gold", primary: "#1B4332", accent: "#D4A017" },
  { name: "Slate & Teal", primary: "#334155", accent: "#0D9488" },
  { name: "Charcoal & Orange", primary: "#1F2937", accent: "#F97316" },
  { name: "Plum & Rose", primary: "#4C1D3D", accent: "#EC4899" },
  { name: "Indigo & Cyan", primary: "#312E81", accent: "#06B6D4" },
];

function useAutoToast(state: ActionState, pending: boolean) {
  const [saved, setSaved] = useState(false);
  const wasPending = useRef(false);
  useEffect(() => {
    if (wasPending.current && !pending && state.error === null) {
      setSaved(true);
      const t = setTimeout(() => setSaved(false), 2000);
      return () => clearTimeout(t);
    }
    wasPending.current = pending;
  }, [pending, state]);
  return saved;
}

export function SettingsClient({
  organization,
  team,
  isAdmin,
}: {
  organization: Organization;
  team: TeamMemberWithPermissions[];
  isAdmin: boolean;
}) {
  if (!isAdmin) {
    return (
      <div className="px-8 py-6">
        <p className="text-sm text-ink-muted">Settings are visible to admins only.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-8 py-6">
      <BrandingSection organization={organization} />
      <ThemeSection organization={organization} />
      <StripeSection organization={organization} />
      <PublicListingSection organization={organization} />
      <TeamSection team={team} />
      <ComingSoonSection />
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-surface p-6 shadow-card">
      <h2 className="mb-4 text-base font-bold text-ink">{title}</h2>
      {children}
    </div>
  );
}

function BrandingSection({ organization }: { organization: Organization }) {
  const [state, formAction, pending] = useActionState(updateBranding, initialState);
  const saved = useAutoToast(state, pending);

  return (
    <SectionCard title="Branding">
      <form action={formAction} className="space-y-4">
        <FormRow>
          <Label htmlFor="name">Facility Name</Label>
          <Input id="name" name="name" defaultValue={organization.name} required />
        </FormRow>
        <FormRow>
          <Label htmlFor="logo_url">Logo URL</Label>
          <Input id="logo_url" name="logo_url" placeholder="https://…" defaultValue={organization.logo_url ?? ""} />
        </FormRow>
        <div className="grid grid-cols-2 gap-4">
          <FormRow>
            <Label htmlFor="address_line1">Address</Label>
            <Input id="address_line1" name="address_line1" defaultValue={organization.address_line1 ?? ""} />
          </FormRow>
          <FormRow>
            <Label htmlFor="address_line2">Address Line 2</Label>
            <Input id="address_line2" name="address_line2" defaultValue={organization.address_line2 ?? ""} />
          </FormRow>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <FormRow>
            <Label htmlFor="city">City</Label>
            <Input id="city" name="city" defaultValue={organization.city ?? ""} />
          </FormRow>
          <FormRow>
            <Label htmlFor="state">State</Label>
            <Input id="state" name="state" defaultValue={organization.state ?? ""} />
          </FormRow>
          <FormRow>
            <Label htmlFor="postal_code">ZIP</Label>
            <Input id="postal_code" name="postal_code" defaultValue={organization.postal_code ?? ""} />
          </FormRow>
        </div>
        {state.error && <p className="text-sm text-red">{state.error}</p>}
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : "Save Branding"}
          </Button>
          {saved && <span className="text-sm text-green">Saved.</span>}
        </div>
      </form>
    </SectionCard>
  );
}

function ThemeSection({ organization }: { organization: Organization }) {
  const [state, formAction, pending] = useActionState(updateTheme, initialState);
  const saved = useAutoToast(state, pending);
  const [primary, setPrimary] = useState(organization.primary_color);
  const [accent, setAccent] = useState(organization.accent_color);

  return (
    <SectionCard title="Theme Customization">
      <div className="mb-4 grid grid-cols-3 gap-3 sm:grid-cols-6">
        {PRESETS.map((p) => (
          <button
            key={p.name}
            type="button"
            title={p.name}
            onClick={() => {
              setPrimary(p.primary);
              setAccent(p.accent);
            }}
            className="flex h-12 overflow-hidden rounded-lg border border-line"
          >
            <span className="w-1/2" style={{ background: p.primary }} />
            <span className="w-1/2" style={{ background: p.accent }} />
          </button>
        ))}
      </div>
      <form action={formAction} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormRow>
            <Label htmlFor="primary_color">Primary Color</Label>
            <div className="flex items-center gap-2">
              <input type="color" value={primary} onChange={(e) => setPrimary(e.target.value)} className="h-9 w-9 rounded border border-line" />
              <Input id="primary_color" name="primary_color" value={primary} onChange={(e) => setPrimary(e.target.value)} />
            </div>
          </FormRow>
          <FormRow>
            <Label htmlFor="accent_color">Accent Color</Label>
            <div className="flex items-center gap-2">
              <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="h-9 w-9 rounded border border-line" />
              <Input id="accent_color" name="accent_color" value={accent} onChange={(e) => setAccent(e.target.value)} />
            </div>
          </FormRow>
        </div>
        {state.error && <p className="text-sm text-red">{state.error}</p>}
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : "Save Theme"}
          </Button>
          {saved && <span className="text-sm text-green">Saved — refresh to see it everywhere.</span>}
        </div>
      </form>
    </SectionCard>
  );
}

function StripeSection({ organization }: { organization: Organization }) {
  const [state, formAction, pending] = useActionState(updateStripeKeys, initialState);
  const saved = useAutoToast(state, pending);

  return (
    <SectionCard title="Stripe (Collect Rent From Tenants)">
      <p className="mb-4 text-sm text-ink-muted">
        Manual keys for now — paste your own Stripe account&apos;s keys below. Stripe Connect (no key-pasting, OAuth
        instead) is planned but not built yet.
      </p>
      <form action={formAction} className="space-y-4">
        <FormRow>
          <Label htmlFor="stripe_publishable_key">Publishable Key</Label>
          <Input id="stripe_publishable_key" name="stripe_publishable_key" placeholder="pk_live_…" defaultValue={organization.stripe_publishable_key ?? ""} />
        </FormRow>
        <FormRow>
          <Label htmlFor="stripe_secret_key">Secret Key</Label>
          <Input id="stripe_secret_key" name="stripe_secret_key" type="password" placeholder="sk_live_…" defaultValue={organization.stripe_secret_key ?? ""} />
        </FormRow>
        {state.error && <p className="text-sm text-red">{state.error}</p>}
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : "Save Stripe Keys"}
          </Button>
          {saved && <span className="text-sm text-green">Saved.</span>}
        </div>
      </form>
    </SectionCard>
  );
}

function PublicListingSection({ organization }: { organization: Organization }) {
  const [state, formAction, pending] = useActionState(updatePublicListing, initialState);
  const saved = useAutoToast(state, pending);
  const [enabled, setEnabled] = useState(organization.public_availability_enabled);

  return (
    <SectionCard title="Public Rental Site">
      <p className="mb-4 text-sm text-ink-muted">
        When on, your public rental site can read this facility&apos;s live unit numbers, sizes, rates, and vacancy
        status — no tenant or payment data is ever exposed. This is what lets the public site&apos;s unit grid stay
        in sync with what staff actually see here, instead of a hardcoded list that drifts out of date.
      </p>
      <form action={formAction} className="space-y-4">
        <label className="flex items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            name="public_availability_enabled"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="h-4 w-4 rounded border-line"
          />
          Show live unit availability on the public rental site
        </label>
        {state.error && <p className="text-sm text-red">{state.error}</p>}
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : "Save"}
          </Button>
          {saved && <span className="text-sm text-green">Saved.</span>}
        </div>
      </form>
    </SectionCard>
  );
}

function TeamSection({ team }: { team: TeamMemberWithPermissions[] }) {
  const [addOpen, setAddOpen] = useState(false);
  const [passwordFor, setPasswordFor] = useState<TeamMemberWithPermissions | null>(null);

  return (
    <SectionCard title="Team Management">
      <div className="mb-3 flex justify-end">
        <Button onClick={() => setAddOpen(true)}>+ Add Team Member</Button>
      </div>
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-line text-[11px] uppercase tracking-wide text-ink-faint">
            <th className="py-2 font-semibold">Name</th>
            <th className="py-2 font-semibold">Email</th>
            <th className="py-2 font-semibold">Access</th>
            <th className="py-2 font-semibold">Login</th>
            <th className="py-2" />
          </tr>
        </thead>
        <tbody>
          {team.map((m) => (
            <tr key={m.id} className="border-b border-line last:border-0">
              <td className="py-2.5 font-medium text-ink">{m.name}</td>
              <td className="py-2.5 text-ink-muted">{m.email}</td>
              <td className="py-2.5 text-ink-muted">{m.permissions.includes("admin") ? "Admin" : `${m.permissions.length} permission(s)`}</td>
              <td className="py-2.5">
                <StatusChip tone={m.hasLogin ? "good" : "warn"} label={m.hasLogin ? "Set up" : "No login yet"} />
              </td>
              <td className="py-2.5 text-right whitespace-nowrap">
                <button onClick={() => setPasswordFor(m)} className="mr-3 text-xs font-semibold text-navy hover:underline">
                  {m.hasLogin ? "Reset Password" : "Set Password"}
                </button>
                {m.active ? (
                  <button onClick={() => deactivateTeamMember(m.id)} className="text-xs font-semibold text-red hover:underline">
                    Deactivate
                  </button>
                ) : (
                  <button onClick={() => reactivateTeamMember(m.id)} className="text-xs font-semibold text-green hover:underline">
                    Reactivate
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <AddTeamMemberModal open={addOpen} onClose={() => setAddOpen(false)} />
      {passwordFor && <SetPasswordModal member={passwordFor} onClose={() => setPasswordFor(null)} />}
    </SectionCard>
  );
}

function AddTeamMemberModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [state, formAction, pending] = useActionState(addTeamMember, initialState);
  const wasPending = useRef(false);
  useEffect(() => {
    if (wasPending.current && !pending && state.error === null) onClose();
    wasPending.current = pending;
  }, [pending, state, onClose]);

  return (
    <Modal open={open} onClose={onClose} title="Add Team Member">
      <form action={formAction} className="space-y-4">
        <FormRow>
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" required />
        </FormRow>
        <FormRow>
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" placeholder="teammate@company.com" required />
        </FormRow>
        <FormRow>
          <Label htmlFor="role">Role</Label>
          <Select id="role" name="role" defaultValue="Admin">
            <option value="Admin">Admin</option>
            <option value="Manager">Manager</option>
            <option value="Staff">Staff</option>
          </Select>
        </FormRow>
        <p className="text-xs text-ink-muted">
          This adds them to Team. There&apos;s no automated invitation email yet — after adding them, use &quot;Set
          Password&quot; and hand them the password directly.
        </p>
        {state.error && <p className="text-sm text-red">{state.error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? "Adding…" : "Add Member"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function SetPasswordModal({ member, onClose }: { member: TeamMemberWithPermissions; onClose: () => void }) {
  const boundAction = setMemberPassword.bind(null, member.id);
  const [state, formAction, pending] = useActionState(boundAction, initialState);
  const wasPending = useRef(false);
  useEffect(() => {
    if (wasPending.current && !pending && state.error === null) onClose();
    wasPending.current = pending;
  }, [pending, state, onClose]);

  return (
    <Modal open onClose={onClose} title={`Set Password — ${member.name}`} size="sm">
      <form action={formAction} className="space-y-4">
        <FormRow>
          <Label htmlFor="password">New Password</Label>
          <Input id="password" name="password" type="text" minLength={8} placeholder="At least 8 characters" required />
        </FormRow>
        <p className="text-xs text-ink-muted">
          Shown in plain text so you can hand it to {member.name.split(" ")[0]} directly — they can change it after
          signing in.
        </p>
        {state.error && <p className="text-sm text-red">{state.error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : "Set Password"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function ComingSoonSection() {
  return (
    <SectionCard title="Coming Soon">
      <div className="grid grid-cols-3 gap-4 text-sm">
        {["Notification Preferences", "Custom Widgets", "Custom Fields"].map((label) => (
          <div key={label} className="rounded-lg border border-dashed border-line p-4 text-ink-faint">
            {label}
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
