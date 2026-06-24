"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Summary" },
  { href: "/materials", label: "Materials" },
  { href: "/import", label: "Import" },
  { href: "/export", label: "Export" },
];

const isActive = (pathname: string, href: string) =>
  href === "/" ? pathname === "/" : pathname.startsWith(href);

const linkCls = (active: boolean) =>
  `rounded-lg px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 ${
    active
      ? "bg-indigo-500/15 text-indigo-300"
      : "text-slate-300 hover:bg-slate-800 hover:text-slate-100"
  }`;

export function MainNav({ isAdmin = false }: { isAdmin?: boolean }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const items = isAdmin
    ? [...links.slice(0, 2), { href: "/users", label: "Users" }, ...links.slice(2)]
    : links;

  return (
    <>
      {/* Desktop */}
      <nav aria-label="Primary" className="hidden items-center gap-1 sm:flex">
        {items.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            aria-current={isActive(pathname, l.href) ? "page" : undefined}
            className={linkCls(isActive(pathname, l.href))}
          >
            {l.label}
          </Link>
        ))}
      </nav>

      {/* Mobile toggle */}
      <button
        type="button"
        aria-label="Menu"
        aria-expanded={open}
        aria-controls="mobile-nav"
        onClick={() => setOpen((v) => !v)}
        className="cursor-pointer rounded-lg border border-slate-700 p-2 text-slate-200 transition-colors hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:hidden"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          className="h-5 w-5"
          aria-hidden="true"
        >
          {open ? (
            <path d="M6 6l12 12M18 6L6 18" />
          ) : (
            <path d="M4 7h16M4 12h16M4 17h16" />
          )}
        </svg>
      </button>

      {/* Mobile panel */}
      {open && (
        <nav
          id="mobile-nav"
          aria-label="Primary"
          className="absolute inset-x-0 top-16 z-20 border-b border-slate-800 bg-slate-900 px-4 py-2 shadow-lg sm:hidden"
        >
          <ul className="flex flex-col gap-1">
            {items.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  onClick={() => setOpen(false)}
                  aria-current={isActive(pathname, l.href) ? "page" : undefined}
                  className={`block ${linkCls(isActive(pathname, l.href))}`}
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </>
  );
}
