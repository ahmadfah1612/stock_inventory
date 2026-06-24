import Link from "next/link";
import { formatIDR } from "@/lib/money";

export type TopItem = { id: string; brand: string; grade: string; value: number };

export function TopBarang({ items }: { items: TopItem[] }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 shadow-sm">
      <h2 className="mb-3 text-sm font-semibold text-slate-100">Barang Nilai Tertinggi</h2>
      {items.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-400">Belum ada stok.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((i) => (
            <li key={i.id}>
              <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                <Link
                  href={`/materials/${i.id}`}
                  className="truncate font-medium text-slate-100 hover:text-indigo-300 hover:underline"
                >
                  {i.brand} <span className="text-slate-400">{i.grade}</span>
                </Link>
                <span className="shrink-0 tabular text-slate-200">{formatIDR(i.value)}</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-indigo-500/150"
                  style={{ width: `${Math.max(2, (i.value / max) * 100).toFixed(1)}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
