import Link from "next/link";
import { formatQty } from "@/lib/money";

export type LowStockItem = { id: string; brand: string; grade: string; qty: number };

export function LowStock({ items, threshold }: { items: LowStockItem[]; threshold: number }) {
  return (
    <div className="rounded-xl border border-amber-500/30 bg-slate-900 p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-100">
          <span aria-hidden="true" className="text-amber-400">⚠</span>
          Stok Menipis
          <span className="font-normal text-slate-500">&lt; {formatQty(threshold)}</span>
        </h2>
        <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-300">
          {items.length} barang
        </span>
      </div>
      {items.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-400">Semua stok aman.</p>
      ) : (
        <ul className="max-h-80 space-y-2.5 overflow-y-auto pr-1">
          {items.map((i) => (
            <li key={i.id} className="flex items-center justify-between gap-2 text-sm">
              <Link
                href={`/materials/${i.id}`}
                className="truncate font-medium text-slate-100 hover:text-indigo-300 hover:underline"
              >
                {i.brand} <span className="text-slate-400">{i.grade}</span>
              </Link>
              <span className="shrink-0 tabular font-medium text-amber-300">{formatQty(i.qty)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
