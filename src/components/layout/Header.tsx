"use client";

import { ReactNode, useState } from "react";
import { logout } from "@/app/(auth)/login/actions";

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

export function Header({
  title,
  subtitle,
  userName,
  orgName,
  actions,
}: {
  title: string;
  subtitle?: string;
  userName: string;
  orgName: string;
  actions?: ReactNode;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="flex items-center justify-between border-b border-line bg-surface px-8 py-5">
      <div>
        <h1 className="text-2xl font-bold text-ink">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-ink-muted">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        {actions}
        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 rounded-full border border-line py-1 pl-1 pr-3 hover:bg-paper"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-navy text-xs font-bold text-white">
              {initials(userName)}
            </span>
            <span className="text-sm">
              <span className="text-ink-muted">Welcome,</span> <span className="font-semibold text-ink">{userName.split(" ")[0]}</span>
            </span>
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="text-ink-muted">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 z-20 mt-2 w-48 rounded-lg border border-line bg-surface py-1 shadow-lg">
                <div className="border-b border-line px-3 py-2">
                  <p className="truncate text-sm font-semibold text-ink">{userName}</p>
                  <p className="truncate text-xs text-ink-muted">{orgName}</p>
                </div>
                <form action={logout}>
                  <button type="submit" className="w-full px-3 py-2 text-left text-sm text-ink-muted hover:bg-paper hover:text-ink">
                    Log out
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
