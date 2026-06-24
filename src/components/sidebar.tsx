"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Summary" },
  { href: "/materials", label: "Materials" },
  { href: "/transaksi", label: "Transaksi" },
  { href: "/import", label: "Import" },
  { href: "/export", label: "Export" },
];

const isActive = (pathname: string, href: string) =>
  href === "/" ? pathname === "/" : pathname.startsWith(href);

const linkCls = (active: boolean) =>
  `block rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 ${
    active
      ? "bg-indigo-500/15 text-indigo-300"
      : "text-slate-300 hover:bg-slate-800 hover:text-slate-100"
  }`;

function Brand() {
  return (
    <div className="flex items-center gap-2.5 px-3">
      <span
        aria-hidden="true"
        className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-bold text-white"
      >
        SI
      </span>
      <span className="text-sm font-semibold tracking-tight text-slate-100 sm:text-base">
        Stock Inventory
      </span>
    </div>
  );
}

export function Sidebar({
  isAdmin = false,
  userName,
  initials,
  signOutAction,
}: {
  isAdmin?: boolean;
  userName: string;
  initials: string;
  signOutAction: () => Promise<void>;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const items = isAdmin
    ? [...links.slice(0, 2), { href: "/users", label: "Users" }, ...links.slice(2)]
    : links;

  const NavLinks = ({ onClick }: { onClick?: () => void }) => (
    <nav aria-label="Primary" className="flex-1 space-y-1 px-3">
      {items.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          onClick={onClick}
          aria-current={isActive(pathname, l.href) ? "page" : undefined}
          className={linkCls(isActive(pathname, l.href))}
        >
          {l.label}
        </Link>
      ))}
    </nav>
  );

  const Footer = () => (
    <div className="border-t border-slate-800 p-3">
      <form action={signOutAction} className="flex items-center gap-2.5">
        <span
          aria-hidden="true"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-700 text-xs font-semibold text-slate-200"
        >
          {initials}
        </span>
        <span className="flex-1 truncate text-sm text-slate-300">{userName}</span>
        <button className="cursor-pointer rounded-lg border border-slate-700 px-3 py-1.5 text-sm font-medium text-slate-200 transition-colors hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
          Keluar
        </button>
      </form>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-slate-800 bg-slate-900 lg:flex">
        <div className="flex h-16 items-center border-b border-slate-800">
          <Brand />
        </div>
        <div className="flex flex-1 flex-col overflow-y-auto py-4">
          <NavLinks />
        </div>
        <Footer />
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-slate-800 bg-slate-900/90 px-4 backdrop-blur lg:hidden">
        <button
          type="button"
          aria-label="Menu"
          aria-expanded={open}
          aria-controls="mobile-sidebar"
          onClick={() => setOpen(true)}
          className="cursor-pointer rounded-lg border border-slate-700 p-2 text-slate-200 transition-colors hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-5 w-5" aria-hidden="true">
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>
        <Brand />
      </header>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-slate-950/70"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <aside
            id="mobile-sidebar"
            className="absolute inset-y-0 left-0 flex w-64 flex-col border-r border-slate-800 bg-slate-900 shadow-xl"
          >
            <div className="flex h-14 items-center justify-between border-b border-slate-800 pr-2">
              <Brand />
              <button
                type="button"
                aria-label="Tutup menu"
                onClick={() => setOpen(false)}
                className="cursor-pointer rounded-lg p-2 text-slate-300 hover:bg-slate-800 hover:text-slate-100"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-5 w-5" aria-hidden="true">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>
            <div className="flex flex-1 flex-col overflow-y-auto py-4">
              <NavLinks onClick={() => setOpen(false)} />
            </div>
            <Footer />
          </aside>
        </div>
      )}
    </>
  );
}
