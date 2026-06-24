"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Summary" },
  { href: "/materials", label: "Materials" },
];

export function MainNav({ isAdmin = false }: { isAdmin?: boolean }) {
  const pathname = usePathname();
  const items = isAdmin ? [...links, { href: "/users", label: "Users" }] : links;
  return (
    <nav aria-label="Primary" className="flex items-center gap-1">
      {items.map((l) => {
        const active = l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 ${
              active
                ? "bg-indigo-500/15 text-indigo-300"
                : "text-slate-300 hover:bg-slate-800 hover:text-slate-100"
            }`}
          >
            {l.label}
          </Link>
        );
      })}
      <Link
        href="/import"
        aria-current={pathname.startsWith("/import") ? "page" : undefined}
        className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 ${
          pathname.startsWith("/import")
            ? "bg-indigo-500/15 text-indigo-300"
            : "text-slate-300 hover:bg-slate-800 hover:text-slate-100"
        }`}
      >
        Import
      </Link>
      <Link
        href="/export"
        aria-current={pathname.startsWith("/export") ? "page" : undefined}
        className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 ${
          pathname.startsWith("/export")
            ? "bg-indigo-500/15 text-indigo-300"
            : "text-slate-300 hover:bg-slate-800 hover:text-slate-100"
        }`}
      >
        Export
      </Link>
    </nav>
  );
}
