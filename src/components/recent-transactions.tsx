import Link from "next/link";
import type { RecentTxn } from "@/server/stats";
import { formatDate, formatQty } from "@/lib/money";
import { TypeBadge } from "@/components/ui";

export function RecentTransactions({ rows }: { rows: RecentTxn[] }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 shadow-sm">
      <h2 className="mb-3 text-sm font-semibold text-slate-100">Transaksi Terbaru</h2>
      {rows.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-400">Belum ada transaksi.</p>
      ) : (
        <ul className="divide-y divide-slate-800">
          {rows.map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-3 py-2.5">
              <div className="flex min-w-0 items-center gap-2.5">
                <TypeBadge type={r.type} />
                <Link
                  href={`/materials/${r.materialId}`}
                  className="truncate text-sm font-medium text-slate-100 hover:text-indigo-300 hover:underline"
                >
                  {r.brand} <span className="text-slate-400">{r.grade}</span>
                </Link>
              </div>
              <div className="flex shrink-0 items-center gap-3 text-sm">
                <span className="tabular text-slate-200">{formatQty(r.qty)}</span>
                <span className="w-20 text-right text-xs text-slate-500">{formatDate(r.date)}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
