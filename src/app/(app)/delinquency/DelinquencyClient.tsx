"use client";

import { useState } from "react";
import type { DelinquentAccount } from "@/lib/data/delinquency";
import { markPaymentPaid } from "@/app/(app)/payments/actions";
import { StatusChip } from "@/components/ui/StatusChip";

export function DelinquencyClient({ accounts, canEdit }: { accounts: DelinquentAccount[]; canEdit: boolean }) {
  const [minDays, setMinDays] = useState(0);
  const filtered = accounts.filter((a) => a.daysLate >= minDays);
  const totalOwed = filtered.reduce((s, a) => s + Number(a.amount), 0);

  return (
    <div className="px-8 py-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-ink-muted">Show accounts late by at least</span>
          <select
            value={minDays}
            onChange={(e) => setMinDays(Number(e.target.value))}
            className="rounded-md border border-line bg-surface px-2 py-1 text-sm"
          >
            <option value={0}>Any</option>
            <option value={3}>3 days</option>
            <option value={7}>7 days</option>
            <option value={30}>30 days</option>
          </select>
        </div>
        <p className="text-sm font-semibold text-ink">
          ${totalOwed.toLocaleString(undefined, { minimumFractionDigits: 2 })} owed across {filtered.length} account(s)
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl bg-surface shadow-card">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead>
            <tr className="border-b border-line text-[11px] uppercase tracking-wide text-ink-faint">
              <th className="px-4 py-3 font-semibold">Tenant</th>
              <th className="px-4 py-3 font-semibold">Unit</th>
              <th className="px-4 py-3 font-semibold">Days Delinquent</th>
              <th className="px-4 py-3 font-semibold">Amount Owed</th>
              {canEdit && <th className="px-4 py-3 font-semibold">Action</th>}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-ink-faint">
                  {accounts.length === 0 ? "No delinquent accounts. Nice." : "No accounts match this filter."}
                </td>
              </tr>
            )}
            {filtered.map((a) => (
              <tr key={a.id} className="border-b border-line last:border-0">
                <td className="px-4 py-3 font-medium text-ink">
                  {a.tenant ? `${a.tenant.first_name} ${a.tenant.last_name}` : "—"}
                </td>
                <td className="px-4 py-3 text-ink-muted">{a.unit?.unit_number ?? "—"}</td>
                <td className="px-4 py-3">
                  <StatusChip tone={a.daysLate >= 14 ? "bad" : "warn"} label={`${a.daysLate} day${a.daysLate === 1 ? "" : "s"}`} />
                </td>
                <td className="px-4 py-3 text-ink-muted">${Number(a.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                {canEdit && (
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3 text-xs font-semibold">
                      {a.tenant?.email && (
                        <a href={`mailto:${a.tenant.email}`} className="text-navy hover:underline">
                          Email
                        </a>
                      )}
                      {a.tenant?.phone && (
                        <a href={`tel:${a.tenant.phone}`} className="text-navy hover:underline">
                          Call
                        </a>
                      )}
                      <button onClick={() => markPaymentPaid(a.id)} className="text-green hover:underline">
                        Mark Paid
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
