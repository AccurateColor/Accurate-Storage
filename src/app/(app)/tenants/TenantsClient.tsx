"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { createTenant, deleteTenant, updateTenant, type ActionState } from "./actions";
import type { TenantWithUnit } from "@/lib/data/tenants";
import type { Unit } from "@/types/database";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input, Label, Select, Textarea, FormRow } from "@/components/ui/Field";
import { StatusChip } from "@/components/ui/StatusChip";

const STATUS_TONE = { lead: "info", active: "good", delinquent: "bad", past: "neutral" } as const;
const STATUS_LABEL = { lead: "Lead", active: "Active", delinquent: "Delinquent", past: "Past" } as const;
const initialState: ActionState = { error: null };

type UnitOption = Pick<Unit, "id" | "unit_number" | "status">;

export function TenantsClient({
  tenants,
  unitOptions,
  canEdit,
}: {
  tenants: TenantWithUnit[];
  unitOptions: UnitOption[];
  canEdit: boolean;
}) {
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<TenantWithUnit | null>(null);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return tenants;
    return tenants.filter((t) =>
      [`${t.first_name} ${t.last_name}`, t.email ?? "", t.phone ?? "", t.unit?.unit_number ?? ""].some((v) =>
        v.toLowerCase().includes(q)
      )
    );
  }, [tenants, query]);

  return (
    <>
      <div className="flex items-center justify-between gap-4 px-8 pt-6">
        <Input placeholder="Search by name, email, phone, or unit…" value={query} onChange={(e) => setQuery(e.target.value)} className="max-w-sm" />
        {canEdit && <Button onClick={() => setAddOpen(true)}>+ Add Tenant</Button>}
      </div>
      <div className="px-8 py-4">
        <div className="overflow-x-auto rounded-xl bg-surface shadow-card">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b border-line text-[11px] uppercase tracking-wide text-ink-faint">
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Unit</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Lease End</th>
                <th className="px-4 py-3 font-semibold">Contact</th>
                {canEdit && <th className="px-4 py-3" />}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-ink-faint">
                    {tenants.length === 0 ? "No leads or tenants yet." : "No matches."}
                  </td>
                </tr>
              )}
              {filtered.map((t) => (
                <tr key={t.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3 font-medium text-ink">
                    {t.first_name} {t.last_name}
                  </td>
                  <td className="px-4 py-3 text-ink-muted">{t.unit?.unit_number ?? "—"}</td>
                  <td className="px-4 py-3">
                    <StatusChip tone={STATUS_TONE[t.status]} label={STATUS_LABEL[t.status]} />
                  </td>
                  <td className="px-4 py-3 text-ink-muted">{t.lease_end ?? "—"}</td>
                  <td className="px-4 py-3 text-ink-muted">{t.email || t.phone || "—"}</td>
                  {canEdit && (
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => setEditing(t)} className="text-xs font-semibold text-pink hover:underline">
                        Edit
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {canEdit && (
        <TenantFormModal open={addOpen} onClose={() => setAddOpen(false)} title="Add Tenant" action={createTenant} submitLabel="Add Tenant" unitOptions={unitOptions} />
      )}
      {canEdit && editing && (
        <TenantFormModal
          open={!!editing}
          onClose={() => setEditing(null)}
          title={`Edit ${editing.first_name} ${editing.last_name}`}
          action={updateTenant.bind(null, editing.id)}
          submitLabel="Save Changes"
          tenant={editing}
          unitOptions={unitOptions}
          onDelete={async () => {
            await deleteTenant(editing.id);
            setEditing(null);
          }}
        />
      )}
    </>
  );
}

function TenantFormModal({
  open,
  onClose,
  title,
  action,
  submitLabel,
  tenant,
  unitOptions,
  onDelete,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  submitLabel: string;
  tenant?: TenantWithUnit;
  unitOptions: UnitOption[];
  onDelete?: () => void;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const wasPending = useRef(false);
  useEffect(() => {
    if (wasPending.current && !pending && state.error === null) onClose();
    wasPending.current = pending;
  }, [pending, state, onClose]);

  // A tenant's own current unit must stay selectable even though it's
  // "occupied" (by them) — otherwise editing them locks the dropdown to
  // only vacant units and can't re-save their own assignment.
  const selectableUnits = unitOptions.filter((u) => u.status === "vacant" || u.id === tenant?.unit_id);

  return (
    <Modal open={open} onClose={onClose} title={title} size="lg">
      <form action={formAction} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormRow>
            <Label htmlFor="first_name">First Name</Label>
            <Input id="first_name" name="first_name" defaultValue={tenant?.first_name} required />
          </FormRow>
          <FormRow>
            <Label htmlFor="last_name">Last Name</Label>
            <Input id="last_name" name="last_name" defaultValue={tenant?.last_name} required />
          </FormRow>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormRow>
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" defaultValue={tenant?.email ?? ""} />
          </FormRow>
          <FormRow>
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" name="phone" type="tel" defaultValue={tenant?.phone ?? ""} />
          </FormRow>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormRow>
            <Label htmlFor="status">Status</Label>
            <Select id="status" name="status" defaultValue={tenant?.status ?? "lead"}>
              <option value="lead">Lead</option>
              <option value="active">Active Tenant</option>
              <option value="delinquent">Delinquent</option>
              <option value="past">Past Tenant</option>
            </Select>
          </FormRow>
          <FormRow>
            <Label htmlFor="unit_id">Unit</Label>
            <Select id="unit_id" name="unit_id" defaultValue={tenant?.unit_id ?? ""}>
              <option value="">— None —</option>
              {selectableUnits.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.unit_number}
                </option>
              ))}
            </Select>
          </FormRow>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormRow>
            <Label htmlFor="lease_start">Lease Start</Label>
            <Input id="lease_start" name="lease_start" type="date" defaultValue={tenant?.lease_start ?? ""} />
          </FormRow>
          <FormRow>
            <Label htmlFor="lease_end">Lease End</Label>
            <Input id="lease_end" name="lease_end" type="date" defaultValue={tenant?.lease_end ?? ""} />
          </FormRow>
        </div>
        <FormRow>
          <Label htmlFor="source">Lead Source</Label>
          <Input id="source" name="source" placeholder="Website, Referral, Walk-in…" defaultValue={tenant?.source ?? ""} />
        </FormRow>
        <FormRow>
          <Label htmlFor="notes">Notes</Label>
          <Textarea id="notes" name="notes" rows={2} defaultValue={tenant?.notes ?? ""} />
        </FormRow>
        {state.error && <p className="text-sm text-red">{state.error}</p>}
        <div className="flex items-center justify-between pt-2">
          {onDelete ? (
            <button type="button" onClick={onDelete} className="text-xs font-semibold text-red hover:underline">
              Delete
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : submitLabel}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
