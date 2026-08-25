"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { createPayment, deletePayment, markPaymentPaid, type ActionState } from "./actions";
import type { PaymentWithRelations } from "@/lib/data/payments";
import type { Tenant, Unit } from "@/types/database";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input, Label, Select, FormRow } from "@/components/ui/Field";
import { StatusChip } from "@/components/ui/StatusChip";

const STATUS_TONE = { paid: "good", due: "info", late: "bad" } as const;
const STATUS_LABEL = { paid: "Paid", due: "Due", late: "Late" } as const;
const initialState: ActionState = { error: null };

type BillableTenant = Pick<Tenant, "id" | "first_name" | "last_name" | "unit_id"> & { unit: Pick<Unit, "unit_number"> | null };

export function PaymentsClient({
  payments,
  billableTenants,
  canEdit,
}: {
  payments: PaymentWithRelations[];
  billableTenants: BillableTenant[];
  canEdit: boolean;
}) {
  const [addOpen, setAddOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | "paid" | "due" | "late">("all");

  const filtered = useMemo(() => (filter === "all" ? payments : payments.filter((p) => p.status === filter)), [payments, filter]);
  const totalDue = payments.filter((p) => p.status !== "paid").reduce((s, p) => s + Number(p.amount), 0);

  return (
    <>
      <div className="flex items-center justify-between gap-4 px-8 pt-6">
        <div className="flex gap-1.5">
          {(["all", "due", "late", "paid"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${filter === f ? "bg-navy text-white" : "bg-surface text-ink-muted hover:bg-navy-soft"}`}
            >
              {f === "all" ? "All" : STATUS_LABEL[f]}
            </button>
          ))}
        </div>
        {canEdit && <Button onClick={() => setAddOpen(true)}>+ Record Payment</Button>}
      </div>
      <p className="px-8 pt-3 text-sm text-ink-muted">${totalDue.toLocaleString(undefined, { minimumFractionDigits: 2 })} outstanding across {payments.filter((p) => p.status !== "paid").length} payment(s)</p>
      <div className="px-8 py-4">
        <div className="overflow-x-auto rounded-xl bg-surface shadow-card">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b border-line text-[11px] uppercase tracking-wide text-ink-faint">
                <th className="px-4 py-3 font-semibold">Tenant</th>
                <th className="px-4 py-3 font-semibold">Unit</th>
                <th className="px-4 py-3 font-semibold">Amount</th>
                <th className="px-4 py-3 font-semibold">Due Date</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                {canEdit && <th className="px-4 py-3" />}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-ink-faint">
                    No payments here yet.
                  </td>
                </tr>
              )}
              {filtered.map((p) => (
                <tr key={p.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3 font-medium text-ink">{p.tenant ? `${p.tenant.first_name} ${p.tenant.last_name}` : "—"}</td>
                  <td className="px-4 py-3 text-ink-muted">{p.unit?.unit_number ?? "—"}</td>
                  <td className="px-4 py-3 text-ink-muted">${Number(p.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  <td className="px-4 py-3 text-ink-muted">{p.due_date}</td>
                  <td className="px-4 py-3">
                    <StatusChip tone={STATUS_TONE[p.status]} label={STATUS_LABEL[p.status]} />
                  </td>
                  {canEdit && (
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      {p.status !== "paid" && (
                        <button onClick={() => markPaymentPaid(p.id)} className="mr-3 text-xs font-semibold text-green hover:underline">
                          Mark Paid
                        </button>
                      )}
                      <button onClick={() => deletePayment(p.id)} className="text-xs font-semibold text-red hover:underline">
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

      {canEdit && <RecordPaymentModal open={addOpen} onClose={() => setAddOpen(false)} billableTenants={billableTenants} />}
    </>
  );
}

function RecordPaymentModal({
  open,
  onClose,
  billableTenants,
}: {
  open: boolean;
  onClose: () => void;
  billableTenants: BillableTenant[];
}) {
  const [state, formAction, pending] = useActionState(createPayment, initialState);
  const [tenantId, setTenantId] = useState("");
  const [status, setStatus] = useState<"due" | "paid" | "late">("due");
  const wasPending = useRef(false);
  useEffect(() => {
    if (wasPending.current && !pending && state.error === null) onClose();
    wasPending.current = pending;
  }, [pending, state, onClose]);

  const selectedTenant = billableTenants.find((t) => t.id === tenantId);

  return (
    <Modal open={open} onClose={onClose} title="Record Payment">
      <form action={formAction} className="space-y-4">
        <FormRow>
          <Label htmlFor="tenant_id">Tenant</Label>
          <Select id="tenant_id" name="tenant_id" value={tenantId} onChange={(e) => setTenantId(e.target.value)} required>
            <option value="">— Select —</option>
            {billableTenants.map((t) => (
              <option key={t.id} value={t.id}>
                {t.first_name} {t.last_name} {t.unit ? `(Unit ${t.unit.unit_number})` : ""}
              </option>
            ))}
          </Select>
        </FormRow>
        <input type="hidden" name="unit_id" value={selectedTenant?.unit_id ?? ""} />
        <div className="grid grid-cols-2 gap-4">
          <FormRow>
            <Label htmlFor="amount">Amount ($)</Label>
            <Input id="amount" name="amount" type="number" step="0.01" required />
          </FormRow>
          <FormRow>
            <Label htmlFor="due_date">Due Date</Label>
            <Input id="due_date" name="due_date" type="date" required />
          </FormRow>
        </div>
        <FormRow>
          <Label htmlFor="status">Status</Label>
          <Select id="status" name="status" value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
            <option value="due">Due (invoice)</option>
            <option value="paid">Paid</option>
            <option value="late">Late</option>
          </Select>
        </FormRow>
        {status === "paid" && (
          <div className="grid grid-cols-2 gap-4">
            <FormRow>
              <Label htmlFor="paid_date">Paid Date</Label>
              <Input id="paid_date" name="paid_date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} />
            </FormRow>
            <FormRow>
              <Label htmlFor="method">Method</Label>
              <Select id="method" name="method" defaultValue="">
                <option value="">—</option>
                <option value="card">Card</option>
                <option value="ach">ACH</option>
                <option value="cash">Cash</option>
                <option value="check">Check</option>
              </Select>
            </FormRow>
          </div>
        )}
        {state.error && <p className="text-sm text-red">{state.error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : "Record Payment"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
