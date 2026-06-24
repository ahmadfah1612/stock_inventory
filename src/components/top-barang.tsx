import Link from "next/link";
import { formatQty } from "@/lib/money";

export type TopItem = { id: string; brand: string; grade: string; qty: number };

export function TopBarang({ items }: { items: TopItem[] }) {
  const max = Math.max(1, ...items.map((i) => i.qty));
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-slate-100">Barang dengan Stok Tersedia</h2>
        <span className="text-xs text-slate-500">{items.length} barang</span>
      </div>
      {items.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-400">Belum ada stok tersedia.</p>
      ) : (
        <ul className="max-h-80 space-y-3 overflow-y-auto pr-1">
          {items.map((i) => (
            <li key={i.id}>
              <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                <Link
                  href={`/materials/${i.id}`}
                  className="truncate font-medium text-slate-100 hover:text-indigo-300 hover:underline"
                >
                  {i.brand} <span className="text-slate-400">{i.grade}</span>
                </Link>
                <span className="shrink-0 tabular text-slate-200">{formatQty(i.qty)}</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-emerald-500"
                  style={{ width: `${Math.max(2, (i.qty / max) * 100).toFixed(1)}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
