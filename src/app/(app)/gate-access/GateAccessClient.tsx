"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { createGateCode, deleteGateCode, toggleGateCodeActive, type ActionState } from "./actions";
import type { GateCodeWithRelations } from "@/lib/data/gate-access";
import type { Tenant, Unit } from "@/types/database";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input, Label, Select, FormRow } from "@/components/ui/Field";
import { StatusChip } from "@/components/ui/StatusChip";

const initialState: ActionState = { error: null };
const LEVEL_LABEL = { tenant: "Tenant", staff: "Staff", visitor: "Visitor", vendor: "Vendor" } as const;

export function GateAccessClient({
  codes,
  tenants,
  units,
  canEdit,
}: {
  codes: GateCodeWithRelations[];
  tenants: Pick<Tenant, "id" | "first_name" | "last_name">[];
  units: Pick<Unit, "id" | "unit_number">[];
  canEdit: boolean;
}) {
  const [addOpen, setAddOpen] = useState(false);

  return (
    <>
      <div className="flex items-center justify-between px-8 pt-6">
        <p className="text-sm text-ink-muted">{codes.length} code{codes.length === 1 ? "" : "s"}</p>
        {canEdit && <Button onClick={() => setAddOpen(true)}>+ Add Access Code</Button>}
      </div>
      <div className="px-8 py-4">
        <div className="overflow-x-auto rounded-xl bg-surface shadow-card">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b border-line text-[11px] uppercase tracking-wide text-ink-faint">
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Code</th>
                <th className="px-4 py-3 font-semibold">Vehicle Plate</th>
                <th className="px-4 py-3 font-semibold">Level</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                {canEdit && <th className="px-4 py-3" />}
              </tr>
            </thead>
            <tbody>
              {codes.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-ink-faint">
                    No gate codes yet.
                  </td>
                </tr>
              )}
              {codes.map((c) => (
                <tr key={c.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3 font-medium text-ink">{c.label}</td>
                  <td className="px-4 py-3 font-mono text-ink-muted">{c.code}</td>
                  <td className="px-4 py-3 text-ink-muted">{c.vehicle_plate ?? "—"}</td>
                  <td className="px-4 py-3 text-ink-muted">{LEVEL_LABEL[c.access_level]}</td>
                  <td className="px-4 py-3">
                    <StatusChip tone={c.active ? "good" : "neutral"} label={c.active ? "Active" : "Inactive"} />
                  </td>
                  {canEdit && (
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button onClick={() => toggleGateCodeActive(c.id, !c.active)} className="mr-3 text-xs font-semibold text-navy hover:underline">
                        {c.active ? "Deactivate" : "Activate"}
                      </button>
                      <button onClick={() => deleteGateCode(c.id)} className="text-xs font-semibold text-red hover:underline">
                        Delete
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {canEdit && <AddGateCodeModal open={addOpen} onClose={() => setAddOpen(false)} tenants={tenants} units={units} />}
    </>
  );
}

function AddGateCodeModal({
  open,
  onClose,
  tenants,
  units,
}: {
  open: boolean;
  onClose: () => void;
  tenants: Pick<Tenant, "id" | "first_name" | "last_name">[];
  units: Pick<Unit, "id" | "unit_number">[];
}) {
  const [state, formAction, pending] = useActionState(createGateCode, initialState);
  const wasPending = useRef(false);
  useEffect(() => {
    if (wasPending.current && !pending && state.error === null) onClose();
    wasPending.current = pending;
  }, [pending, state, onClose]);

  return (
    <Modal open={open} onClose={onClose} title="Add Access Code">
      <form action={formAction} className="space-y-4">
        <FormRow>
          <Label htmlFor="label">Name / Description</Label>
          <Input id="label" name="label" placeholder="Jane Doe, or “Roofing vendor — 8/25”" required />
        </FormRow>
        <div className="grid grid-cols-2 gap-4">
          <FormRow>
            <Label htmlFor="tenant_id">Tenant (optional)</Label>
            <Select id="tenant_id" name="tenant_id" defaultValue="">
              <option value="">—</option>
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.first_name} {t.last_name}
                </option>
              ))}
            </Select>
          </FormRow>
          <FormRow>
            <Label htmlFor="unit_id">Unit (optional)</Label>
            <Select id="unit_id" name="unit_id" defaultValue="">
              <option value="">—</option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.unit_number}
                </option>
              ))}
            </Select>
          </FormRow>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormRow>
            <Label htmlFor="code">Access Code</Label>
            <Input id="code" name="code" required />
          </FormRow>
          <FormRow>
            <Label htmlFor="access_level">Access Level</Label>
            <Select id="access_level" name="access_level" defaultValue="tenant">
              <option value="tenant">Tenant</option>
              <option value="staff">Staff</option>
              <option value="visitor">Visitor</option>
              <option value="vendor">Vendor</option>
            </Select>
          </FormRow>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormRow>
            <Label htmlFor="vehicle_plate">Vehicle Plate (optional)</Label>
            <Input id="vehicle_plate" name="vehicle_plate" />
          </FormRow>
          <FormRow>
            <Label htmlFor="expires_at">Expires (optional)</Label>
            <Input id="expires_at" name="expires_at" type="date" />
          </FormRow>
        </div>
        {state.error && <p className="text-sm text-red">{state.error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : "Add Code"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
