/**
 * Hand-drawn, generic 20x20 stroke icons for the sidebar — deliberately
 * not pulled from an icon library (this app's whole "no dependency you
 * don't need" philosophy, same as Sparkline/BarChart/DonutChart).
 */
const PATHS: Record<string, string> = {
  dashboard: "M4 4h6v6H4V4Zm10 0h6v6h-6V4ZM4 14h6v6H4v-6Zm10 0h6v6h-6v-6Z",
  tenants: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8a7 7 0 0 1 14 0",
  units: "M4 21V7l8-4 8 4v14M4 21h16M9 21v-6h6v6",
  payments: "M3 7h18v12H3V7Zm0 4h18M7 15h4",
  delinquency: "M12 8v5l3 2M21 12a9 9 0 1 1-9-9",
  gate: "M6 10V7a6 6 0 0 1 12 0v3M5 10h14v10H5V10Zm7 4v3",
  automation: "M13 3 4 14h7l-1 7 9-11h-7l1-7Z",
  contacts: "M4 4h13l3 4-3 4H4V4Zm0 0v16m0-8h9",
  tasks: "M4 6h16M4 6l2 2 2-2M4 12h16M4 12l2 2 2-2M4 18h10",
  reports: "M4 20V10m6 10V4m6 16v-7",
  marketing: "M4 11v2l14 5V6L4 11Zm0 0H2m9 8 1 3h2l-1-4",
  documents: "M6 3h9l4 4v14H6V3Zm9 0v4h4",
  settings:
    "M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6ZM4.5 12a7.4 7.4 0 0 1 .15-1.5L3 9l1.5-2.6 2.1.7c.7-.6 1.5-1 2.4-1.3L9.5 4h5l.5 2.8c.9.3 1.7.7 2.4 1.3l2.1-.7L21 9l-1.65 1.5c.1.5.15 1 .15 1.5s-.05 1-.15 1.5L21 15l-1.5 2.6-2.1-.7c-.7.6-1.5 1-2.4 1.3L14.5 20h-5l-.5-2.8a7 7 0 0 1-2.4-1.3l-2.1.7L3 15l1.65-1.5c-.1-.5-.15-1-.15-1.5Z",
};

export type NavIconName = keyof typeof PATHS;

export function NavIcon({ name, size = 18 }: { name: NavIconName; size?: number }) {
  const d = PATHS[name];
  if (!d) return null;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <path d={d} />
    </svg>
  );
}
