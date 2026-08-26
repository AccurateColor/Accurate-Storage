"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { createUnit, deleteUnit, updateUnit, type ActionState } from "./actions";
import type { UnitWithTenant } from "@/lib/data/units";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input, Label, Select, Textarea, FormRow } from "@/components/ui/Field";
import { StatusChip } from "@/components/ui/StatusChip";

const STATUS_TONE = { vacant: "warn", occupied: "good", reserved: "info", maintenance: "neutral" } as const;
const STATUS_LABEL = { vacant: "Vacant", occupied: "Occupied", reserved: "Reserved", maintenance: "Maintenance" } as const;
const initialState: ActionState = { error: null };

export function UnitsClient({ units, canEdit }: { units: UnitWithTenant[]; canEdit: boolean }) {
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<UnitWithTenant | null>(null);

  return (
    <>
      <div className="flex items-center justify-between px-8 pt-6">
        <p className="text-sm text-ink-muted">{units.length} unit{units.length === 1 ? "" : "s"}</p>
        {canEdit && <Button onClick={() => setAddOpen(true)}>+ Add Unit</Button>}
      </div>
      <div className="px-8 py-4">
        <div className="overflow-x-auto rounded-xl bg-surface shadow-card">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b border-line text-[11px] uppercase tracking-wide text-ink-faint">
                <th className="px-4 py-3 font-semibold">Unit</th>
                <th className="px-4 py-3 font-semibold">Size</th>
                <th className="px-4 py-3 font-semibold">Sq Ft</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Tenant</th>
                <th className="px-4 py-3 font-semibold">Rate</th>
                {canEdit && <th className="px-4 py-3" />}
              </tr>
            </thead>
            <tbody>
              {units.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-ink-faint">
                    No units yet. Add your first unit to get started.
                  </td>
                </tr>
              )}
              {units.map((u) => (
                <tr key={u.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3 font-medium text-ink">{u.unit_number}</td>
                  <td className="px-4 py-3 text-ink-muted">{u.size ?? "—"}</td>
                  <td className="px-4 py-3 text-ink-muted">{u.square_footage ?? "—"}</td>
                  <td className="px-4 py-3">
                    <StatusChip tone={STATUS_TONE[u.status]} label={STATUS_LABEL[u.status]} />
                  </td>
                  <td className="px-4 py-3 text-ink-muted">{u.tenant ? `${u.tenant.first_name} ${u.tenant.last_name}` : "—"}</td>
                  <td className="px-4 py-3 text-ink-muted">${Number(u.monthly_rate).toLocaleString()}/mo</td>
                  {canEdit && (
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => setEditing(u)} className="text-xs font-semibold text-pink hover:underline">
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
        <UnitFormModal
          open={addOpen}
          onClose={() => setAddOpen(false)}
          title="Add Unit"
          action={createUnit}
          submitLabel="Add Unit"
        />
      )}
      {canEdit && editing && (
        <UnitFormModal
          open={!!editing}
          onClose={() => setEditing(null)}
          title={`Edit Unit ${editing.unit_number}`}
          action={updateUnit.bind(null, editing.id)}
          submitLabel="Save Changes"
          unit={editing}
          onDelete={async () => {
            await deleteUnit(editing.id);
            setEditing(null);
          }}
        />
      )}
    </>
  );
}

function UnitFormModal({
  open,
  onClose,
  title,
  action,
  submitLabel,
  unit,
  onDelete,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  submitLabel: string;
  unit?: UnitWithTenant;
  onDelete?: () => void;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);

  // Close on a successful submit only — i.e. a pending(true)->pending(false)
  // transition that left no error — not on the initial mount, where state
  // also happens to read {error: null}.
  const wasPending = useRef(false);
  useEffect(() => {
    if (wasPending.current && !pending && state.error === null) onClose();
    wasPending.current = pending;
  }, [pending, state, onClose]);

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <form action={formAction} className="space-y-4">
        <FormRow>
          <Label htmlFor="unit_number">Unit Number</Label>
          <Input id="unit_number" name="unit_number" defaultValue={unit?.unit_number} required />
        </FormRow>
        <div className="grid grid-cols-2 gap-4">
          <FormRow>
            <Label htmlFor="size">Size</Label>
            <Input id="size" name="size" placeholder="10x10" defaultValue={unit?.size ?? ""} />
          </FormRow>
          <FormRow>
            <Label htmlFor="square_footage">Square Footage</Label>
            <Input id="square_footage" name="square_footage" type="number" defaultValue={unit?.square_footage ?? ""} />
          </FormRow>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormRow>
            <Label htmlFor="monthly_rate">Monthly Rate ($)</Label>
            <Input id="monthly_rate" name="monthly_rate" type="number" step="0.01" defaultValue={unit?.monthly_rate ?? ""} required />
          </FormRow>
          <FormRow>
            <Label htmlFor="status">Status</Label>
            <Select id="status" name="status" defaultValue={unit?.status ?? "vacant"}>
              <option value="vacant">Vacant</option>
              <option value="occupied">Occupied</option>
              <option value="reserved">Reserved</option>
              <option value="maintenance">Maintenance</option>
            </Select>
          </FormRow>
        </div>
        <FormRow>
          <Label htmlFor="stripe_price_id">
            Stripe Price ID <span className="normal-case font-normal text-ink-faint">(for the public rental site&apos;s checkout)</span>
          </Label>
          <Input id="stripe_price_id" name="stripe_price_id" placeholder="price_…" defaultValue={unit?.stripe_price_id ?? ""} />
        </FormRow>
        <FormRow>
          <Label htmlFor="notes">Notes</Label>
          <Textarea id="notes" name="notes" rows={2} defaultValue={unit?.notes ?? ""} />
        </FormRow>
        {state.error && <p className="text-sm text-red">{state.error}</p>}
        <div className="flex items-center justify-between pt-2">
          {onDelete ? (
            <button type="button" onClick={onDelete} className="text-xs font-semibold text-red hover:underline">
              Delete Unit
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
