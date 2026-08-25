"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { Logo } from "./Logo";
import { NavIcon, type NavIconName } from "./NavIcon";

export type NavItem = { href?: string; label: string; icon: NavIconName; soon?: boolean };

export function Sidebar({
  items,
  orgName,
  logoUrl,
}: {
  items: NavItem[];
  orgName: string;
  logoUrl?: string | null;
}) {
  const pathname = usePathname();

  const allHrefs = items.map((i) => i.href).filter((h): h is string => Boolean(h));
  const bestMatch = allHrefs
    .filter((h) => (h === "/" ? pathname === "/" : pathname === h || pathname.startsWith(h + "/")))
    .sort((a, b) => b.length - a.length)[0];

  return (
    <aside className="flex w-56 shrink-0 flex-col bg-navy-dark text-white/80">
      <div className="flex items-center gap-2.5 px-4 py-5">
        <Logo size={34} logoUrl={logoUrl} name={orgName} />
        <p className="truncate text-sm font-bold tracking-wide text-white uppercase">{orgName}</p>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2.5 pb-4">
        {items.map((item) => {
          if (item.soon || !item.href) {
            return (
              <div
                key={item.label}
                className="flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm font-medium text-white/35"
              >
                <NavIcon name={item.icon} />
                <span className="flex-1">{item.label}</span>
                <span className="rounded bg-white/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white/50">
                  Soon
                </span>
              </div>
            );
          }
          const active = item.href === bestMatch;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                active ? "bg-pink text-white" : "text-white/70 hover:bg-white/10 hover:text-white"
              )}
            >
              <NavIcon name={item.icon} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="p-3">
        <a
          href="mailto:support@accuratestorage.net"
          className="flex items-center gap-2.5 rounded-lg bg-pink/15 px-3 py-3 text-xs font-semibold text-white transition-colors hover:bg-pink/25"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-pink">
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M4 13v-1a8 8 0 0 1 16 0v1M4 13v5a2 2 0 0 0 2 2h1v-7H5a1 1 0 0 0-1 1Zm16 0v5a2 2 0 0 1-2 2h-1v-7h2a1 1 0 0 1 1 1Z" />
            </svg>
          </span>
          <span>
            Need Help?
            <br />
            <span className="text-white/60">Contact Support</span>
          </span>
        </a>
      </div>
    </aside>
  );
}
