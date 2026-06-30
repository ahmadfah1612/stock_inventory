import Link from "next/link";
import { formatDate, formatIDR, formatQty } from "@/lib/money";
import type { MaterialMutations } from "@/server/hpp-report";

function FlowBadge({ type }: { type: string }) {
  const isIn = type === "buy";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${
        isIn
          ? "bg-emerald-500/15 text-emerald-300 ring-emerald-600/20"
          : "bg-amber-500/15 text-amber-300 ring-amber-600/20"
      }`}
    >
      {isIn ? "Masuk" : "Keluar"}
    </span>
  );
}

function AvgCostCell({ value, prev }: { value: string; prev?: string }) {
  const cur = Number(value);
  const before = prev !== undefined ? Number(prev) : cur;
  const changed = prev !== undefined && Math.abs(cur - before) > 0.001;
  const up = cur > before;

  return (
    <span className="inline-flex items-center justify-end gap-1">
      {formatIDR(value)}
      {changed && (
        <span
          aria-label={up ? "Harga naik" : "Harga turun"}
          className={`text-xs ${up ? "text-rose-400" : "text-emerald-400"}`}
        >
          {up ? "↑" : "↓"}
        </span>
      )}
    </span>
  );
}

export function HppMutationTables({ groups }: { groups: MaterialMutations[] }) {
  if (groups.length === 0) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900 px-6 py-16 text-center shadow-sm">
        <p className="text-sm font-medium text-slate-100">Tidak ada mutasi</p>
        <p className="mt-1 text-sm text-slate-400">Belum ada transaksi untuk periode ini.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {groups.map((g) => (
        <div key={g.id} className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900 shadow-sm">
          <div className="border-b border-slate-800 px-4 py-3">
            <Link
              href={`/materials/${g.id}`}
              className="text-sm font-semibold text-indigo-300 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              {g.grade} {g.brand}
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-800/50 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                  <th className="px-4 py-2.5">Tanggal</th>
                  <th className="px-4 py-2.5">Jenis</th>
                  <th className="px-4 py-2.5 text-right">Qty</th>
                  <th className="px-4 py-2.5 text-right">Harga rata2</th>
                  <th className="px-4 py-2.5 text-right">HPP keluar</th>
                  <th className="px-4 py-2.5 text-right">Sisa qty</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {g.rows.map((r, i) => {
                  const isIn = r.type === "buy";
                  const prevAvg = i > 0 ? g.rows[i - 1].avgCost : undefined;
                  return (
                    <tr key={r.id} className="transition-colors hover:bg-slate-800/50">
                      <td className="whitespace-nowrap px-4 py-2.5 text-slate-200">{formatDate(r.date)}</td>
                      <td className="px-4 py-2.5">
                        <FlowBadge type={r.type} />
                      </td>
                      <td className="px-4 py-2.5 text-right tabular text-slate-200">{formatQty(r.qty)}</td>
                      <td className="px-4 py-2.5 text-right tabular text-slate-300">
                        <AvgCostCell value={r.avgCost} prev={prevAvg} />
                      </td>
                      <td className="px-4 py-2.5 text-right tabular text-slate-300">
                        {!isIn && Number(r.cogs) > 0 ? formatIDR(r.cogs) : "—"}
                      </td>
                      <td className="px-4 py-2.5 text-right tabular font-medium text-slate-100">
                        {formatQty(r.balQty)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}
      <p className="text-xs text-slate-500">
        Harga rata-rata dihitung dengan metode rata-rata bergerak (weighted moving average). Panah menunjukkan perubahan HPP setelah transaksi.
      </p>
    </div>
  );
}
