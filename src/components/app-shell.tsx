"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = { href: string; label: string; icon: ReactNode };

const icon = (path: ReactNode) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-5 w-5 shrink-0"
    aria-hidden="true"
  >
    {path}
  </svg>
);

const ICONS = {
  summary: icon(<><rect x="3" y="3" width="7" height="9" rx="1" /><rect x="14" y="3" width="7" height="5" rx="1" /><rect x="14" y="12" width="7" height="9" rx="1" /><rect x="3" y="16" width="7" height="5" rx="1" /></>),
  materials: icon(<><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><path d="m3.3 7 8.7 5 8.7-5" /><path d="M12 22V12" /></>),
  transaksi: icon(<><path d="m16 3 4 4-4 4" /><path d="M20 7H4" /><path d="m8 21-4-4 4-4" /><path d="M4 17h16" /></>),
  report: icon(<><path d="M3 3v18h18" /><rect x="7" y="11" width="3" height="6" rx="0.5" /><rect x="12" y="7" width="3" height="10" rx="0.5" /><rect x="17" y="13" width="3" height="4" rx="0.5" /></>),
  import: icon(<><path d="M12 3v12" /><path d="m7 10 5 5 5-5" /><path d="M5 21h14" /></>),
  export: icon(<><path d="M12 15V3" /><path d="m7 8 5-5 5 5" /><path d="M5 21h14" /></>),
  users: icon(<><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>),
  settings: icon(<><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></>),
};

const baseLinks: NavItem[] = [
  { href: "/", label: "Summary", icon: ICONS.summary },
  { href: "/materials", label: "Materials", icon: ICONS.materials },
  { href: "/transaksi", label: "Transaksi", icon: ICONS.transaksi },
  { href: "/report", label: "Report", icon: ICONS.report },
  { href: "/import", label: "Import", icon: ICONS.import },
  { href: "/export", label: "Export", icon: ICONS.export },
];

const isActive = (pathname: string, href: string) =>
  href === "/" ? pathname === "/" : pathname.startsWith(href);

function Brand({ collapsed }: { collapsed: boolean }) {
  return (
    <div className="flex h-16 items-center gap-2.5 overflow-hidden border-b border-slate-800 px-4">
      <span
        aria-hidden="true"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-bold text-white shadow-lg shadow-indigo-900/30"
      >
        SI
      </span>
      <span
        className={`whitespace-nowrap text-base font-semibold tracking-tight text-slate-100 transition-all duration-200 ${
          collapsed ? "translate-x-2 opacity-0" : "opacity-100"
        }`}
      >
        Stock Inventory
      </span>
    </div>
  );
}

export function AppShell({
  isAdmin = false,
  userName,
  initials,
  signOutAction,
  children,
}: {
  isAdmin?: boolean;
  userName: string;
  initials: string;
  signOutAction: () => Promise<void>;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setCollapsed(localStorage.getItem("sidebar-collapsed") === "1");
    setReady(true);
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((c) => {
      const next = !c;
      localStorage.setItem("sidebar-collapsed", next ? "1" : "0");
      return next;
    });
  };

  const items: NavItem[] = isAdmin
    ? [
        ...baseLinks.slice(0, 2),
        { href: "/users", label: "Users", icon: ICONS.users },
        ...baseLinks.slice(2),
        { href: "/settings", label: "Settings", icon: ICONS.settings },
      ]
    : baseLinks;

  const NavLinks = ({ onNavigate, collapsed: col }: { onNavigate?: () => void; collapsed: boolean }) => (
    <nav aria-label="Primary" className="flex-1 space-y-1 px-3 py-4">
      {items.map((l) => {
        const active = isActive(pathname, l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            onClick={onNavigate}
            title={col ? l.label : undefined}
            aria-current={active ? "page" : undefined}
            className={`group/link relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 ${
              active
                ? "bg-indigo-500/15 text-indigo-300"
                : "text-slate-300 hover:bg-slate-800 hover:text-slate-100"
            }`}
          >
            <span
              className={`absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-indigo-400 transition-all duration-200 ${
                active ? "opacity-100" : "opacity-0"
              }`}
              aria-hidden="true"
            />
            <span className={`transition-transform duration-200 group-hover/link:scale-110 ${active ? "text-indigo-300" : ""}`}>
              {l.icon}
            </span>
            <span
              className={`whitespace-nowrap transition-all duration-200 ${
                col ? "pointer-events-none translate-x-2 opacity-0" : "opacity-100"
              }`}
            >
              {l.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );

  const Footer = ({ collapsed: col }: { collapsed: boolean }) => (
    <div className="border-t border-slate-800 p-3">
      <form action={signOutAction} className="flex items-center gap-2.5 overflow-hidden">
        <span
          aria-hidden="true"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-700 text-xs font-semibold text-slate-200"
        >
          {initials}
        </span>
        <span className={`flex-1 truncate text-sm text-slate-300 transition-all duration-200 ${col ? "w-0 opacity-0" : "opacity-100"}`}>
          {userName}
        </span>
        <button
          title="Keluar"
          className="cursor-pointer rounded-lg border border-slate-700 p-2 text-slate-200 transition-colors hover:bg-slate-800 hover:text-rose-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <path d="m16 17 5-5-5-5" />
            <path d="M21 12H9" />
          </svg>
        </button>
      </form>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Desktop sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-slate-800 bg-slate-900 transition-[width] duration-300 ease-in-out lg:flex ${
          collapsed ? "w-[4.5rem]" : "w-64"
        }`}
      >
        <Brand collapsed={collapsed} />
        <div className="flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
          <NavLinks collapsed={collapsed} />
        </div>
        <button
          type="button"
          onClick={toggleCollapsed}
          aria-label={collapsed ? "Perlebar menu" : "Perkecil menu"}
          className="flex cursor-pointer items-center justify-center border-t border-slate-800 py-2.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-100"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`h-5 w-5 transition-transform duration-300 ${collapsed ? "rotate-180" : ""}`} aria-hidden="true">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
        <Footer collapsed={collapsed} />
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-slate-800 bg-slate-900/90 px-4 backdrop-blur lg:hidden">
        <button
          type="button"
          aria-label="Menu"
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen(true)}
          className="cursor-pointer rounded-lg border border-slate-700 p-2 text-slate-200 transition-colors hover:bg-slate-800"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-5 w-5" aria-hidden="true">
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>
        <span className="flex items-center gap-2">
          <span aria-hidden="true" className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-xs font-bold text-white">SI</span>
          <span className="text-sm font-semibold text-slate-100">Stock Inventory</span>
        </span>
      </header>

      {/* Mobile drawer (always mounted for slide animation) */}
      <div className={`fixed inset-0 z-40 lg:hidden ${mobileOpen ? "" : "pointer-events-none"}`}>
        <div
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
          className={`absolute inset-0 bg-slate-950/70 transition-opacity duration-300 ${mobileOpen ? "opacity-100" : "opacity-0"}`}
        />
        <aside
          className={`absolute inset-y-0 left-0 flex w-64 flex-col border-r border-slate-800 bg-slate-900 shadow-2xl transition-transform duration-300 ease-in-out ${
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex h-14 items-center justify-between border-b border-slate-800 pl-4 pr-2">
            <span className="flex items-center gap-2">
              <span aria-hidden="true" className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-xs font-bold text-white">SI</span>
              <span className="text-sm font-semibold text-slate-100">Stock Inventory</span>
            </span>
            <button
              type="button"
              aria-label="Tutup menu"
              onClick={() => setMobileOpen(false)}
              className="cursor-pointer rounded-lg p-2 text-slate-300 hover:bg-slate-800 hover:text-slate-100"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-5 w-5" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>
          <div className="flex flex-1 flex-col overflow-y-auto">
            <NavLinks collapsed={false} onNavigate={() => setMobileOpen(false)} />
          </div>
          <Footer collapsed={false} />
        </aside>
      </div>

      {/* Content */}
      <div className={`${ready ? "transition-[padding] duration-300 ease-in-out" : ""} ${collapsed ? "lg:pl-[4.5rem]" : "lg:pl-64"}`}>
        <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>
      </div>
    </div>
  );
}
