"use client";

import {
  BUILDING_A_COLUMNS,
  BUILDING_A_LAYOUT,
  BUILDING_A_NON_RENTABLE,
  BUILDING_A_ROWS,
  BUILDING_B_COLUMNS,
  BUILDING_B_LAYOUT,
  BUILDING_B_ROWS,
} from "@/lib/facility-layout";
import type { UnitWithTenant } from "@/lib/data/units";

const STATUS_BG: Record<UnitWithTenant["status"], string> = {
  vacant: "bg-amber-soft hover:bg-amber/30 text-ink",
  occupied: "bg-green-soft hover:bg-green/30 text-ink",
  reserved: "bg-navy-soft hover:bg-navy/20 text-ink",
  maintenance: "bg-line hover:bg-ink-faint/30 text-ink-muted",
};

export function FacilityMap({
  units,
  onSelectUnit,
}: {
  units: UnitWithTenant[];
  onSelectUnit: (unit: UnitWithTenant) => void;
}) {
  const byNumber = new Map(units.map((u) => [u.unit_number, u]));
  const unmapped = units.filter((u) => !BUILDING_A_LAYOUT.some((c) => c.unitNumber === u.unit_number) && !BUILDING_B_LAYOUT.some((c) => c.unitNumber === u.unit_number));

  return (
    <div className="px-8 pb-8">
      <div className="mb-4 flex flex-wrap items-center gap-4 rounded-lg bg-surface px-4 py-3 text-xs shadow-card">
        <span className="font-semibold text-ink-muted">Status:</span>
        <Legend swatch="bg-amber-soft" label="Vacant" />
        <Legend swatch="bg-green-soft" label="Occupied" />
        <Legend swatch="bg-navy-soft" label="Reserved" />
        <Legend swatch="bg-line" label="Maintenance" />
        <Legend swatch="bg-paper border border-dashed border-line" label="Not a storage unit" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <BuildingGrid
          name="Building A"
          gateLabel="Entrance Gate"
          columns={BUILDING_A_COLUMNS}
          rows={BUILDING_A_ROWS}
          cells={BUILDING_A_LAYOUT}
          nonRentable={[BUILDING_A_NON_RENTABLE]}
          byNumber={byNumber}
          onSelectUnit={onSelectUnit}
        />
        <BuildingGrid
          name="Building B"
          gateLabel="Exit Gate"
          columns={BUILDING_B_COLUMNS}
          rows={BUILDING_B_ROWS}
          cells={BUILDING_B_LAYOUT}
          nonRentable={[]}
          byNumber={byNumber}
          onSelectUnit={onSelectUnit}
        />
      </div>

      {unmapped.length > 0 && (
        <div className="mt-6 rounded-lg bg-surface p-4 text-sm shadow-card">
          <p className="mb-2 font-semibold text-ink">Not shown on the map ({unmapped.length})</p>
          <p className="mb-3 text-xs text-ink-muted">
            These units don&apos;t have a position on the facility map yet — add one to{" "}
            <code className="rounded bg-paper px-1">facility-layout.ts</code>, or use List View to manage them.
          </p>
          <div className="flex flex-wrap gap-2">
            {unmapped.map((u) => (
              <button
                key={u.id}
                onClick={() => onSelectUnit(u)}
                className={`rounded px-2 py-1 text-xs font-semibold ${STATUS_BG[u.status]}`}
              >
                {u.unit_number}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Legend({ swatch, label }: { swatch: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-ink-muted">
      <span className={`h-3 w-3 rounded ${swatch}`} />
      {label}
    </span>
  );
}

function BuildingGrid({
  name,
  gateLabel,
  columns,
  rows,
  cells,
  nonRentable,
  byNumber,
  onSelectUnit,
}: {
  name: string;
  gateLabel: string;
  columns: number;
  rows: number;
  cells: { unitNumber: string; colStart: number; colEnd: number; rowStart: number; rowEnd: number }[];
  nonRentable: { label: string; colStart: number; colEnd: number; rowStart: number; rowEnd: number }[];
  byNumber: Map<string, UnitWithTenant>;
  onSelectUnit: (unit: UnitWithTenant) => void;
}) {
  return (
    <div className="rounded-xl bg-surface p-5 shadow-card">
      <h2 className="mb-3 text-base font-bold text-ink">{name}</h2>
      <div
        className="grid gap-1"
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${rows}, minmax(22px, 1fr))` }}
      >
        {nonRentable.map((block) => (
          <div
            key={block.label}
            className="flex items-center justify-center rounded border border-dashed border-line bg-paper p-1 text-center text-[10px] font-semibold text-ink-faint"
            style={{ gridColumn: `${block.colStart} / ${block.colEnd}`, gridRow: `${block.rowStart} / ${block.rowEnd}` }}
          >
            {block.label}
          </div>
        ))}
        {cells.map((cell) => {
          const unit = byNumber.get(cell.unitNumber);
          return (
            <button
              key={cell.unitNumber}
              onClick={() => unit && onSelectUnit(unit)}
              disabled={!unit}
              title={unit ? `${unit.unit_number} — ${unit.size ?? "size unknown"} — $${Number(unit.monthly_rate)}/mo${unit.tenant ? ` — ${unit.tenant.first_name} ${unit.tenant.last_name}` : ""}` : `${cell.unitNumber} — not set up yet`}
              className={`flex flex-col items-center justify-center overflow-hidden rounded border border-line/60 p-0.5 text-center transition-colors ${unit ? STATUS_BG[unit.status] : "bg-paper text-ink-faint"}`}
              style={{ gridColumn: `${cell.colStart} / ${cell.colEnd}`, gridRow: `${cell.rowStart} / ${cell.rowEnd}` }}
            >
              <span className="text-[10px] font-bold leading-tight">{cell.unitNumber}</span>
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-center text-[10px] font-semibold uppercase tracking-wide text-ink-faint">{gateLabel}</p>
    </div>
  );
}
