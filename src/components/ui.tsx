import Link from "next/link";
import type { ReactNode } from "react";

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-slate-100 sm:text-2xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-400">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-400">{label}</p>
      <p className="mt-1.5 text-2xl font-semibold tracking-tight text-slate-100 tabular">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`overflow-hidden rounded-xl border border-slate-800 bg-slate-900 shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

const TYPE_STYLES: Record<string, string> = {
  buy: "bg-emerald-500/15 text-emerald-300 ring-emerald-600/20",
  sell: "bg-indigo-500/15 text-indigo-300 ring-indigo-600/20",
  sample: "bg-amber-500/15 text-amber-300 ring-amber-600/20",
  scrap: "bg-rose-500/15 text-rose-300 ring-rose-600/20",
};

const TYPE_LABELS: Record<string, string> = {
  buy: "Buy",
  sell: "Sell",
  sample: "Sample",
  scrap: "Scrap",
};

export function TypeBadge({ type }: { type: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
        TYPE_STYLES[type] ?? "bg-slate-800 text-slate-200 ring-slate-600/20"
      }`}
    >
      {TYPE_LABELS[type] ?? type}
    </span>
  );
}

export function StokKosongBadge() {
  return (
    <span className="inline-flex items-center rounded-full bg-slate-800 px-2 py-0.5 text-xs font-medium text-slate-400 ring-1 ring-inset ring-slate-400/20">
      Stok Kosong
    </span>
  );
}

export function PrimaryLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
    >
      {children}
    </Link>
  );
}
