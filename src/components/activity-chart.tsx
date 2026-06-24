import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import type { MonthStat } from "@/server/stats";
import { formatIDR } from "@/lib/money";

const monthLabel = (ym: string) => format(new Date(`${ym}-01T00:00:00`), "MMM yy", { locale: idLocale });

export function ActivityChart({ data }: { data: MonthStat[] }) {
  const max = Math.max(1, ...data.flatMap((m) => [m.buy, m.sell]));
  const pct = (v: number) => `${((v / max) * 100).toFixed(1)}%`;
  const hasData = data.some((m) => m.buy > 0 || m.sell > 0);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Aktivitas 12 Bulan Terakhir</h2>
          <p className="mt-0.5 text-xs text-slate-500">Nilai Pembelian vs Penjualan per bulan.</p>
        </div>
        <div className="flex items-center gap-4 text-xs text-slate-600">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" aria-hidden="true" />
            Pembelian
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-indigo-500" aria-hidden="true" />
            Penjualan
          </span>
        </div>
      </div>

      {!hasData ? (
        <p className="rounded-lg bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
          Belum ada transaksi untuk ditampilkan.
        </p>
      ) : (
        <div className="flex h-48 items-end gap-1.5 sm:gap-3">
          {data.map((m) => (
            <div key={m.ym} className="flex h-full flex-1 flex-col items-center">
              <div className="flex w-full flex-1 items-end justify-center gap-0.5 sm:gap-1">
                <div
                  className="w-2 rounded-t bg-emerald-500 transition-all sm:w-2.5"
                  style={{ height: pct(m.buy) }}
                  title={`Pembelian ${monthLabel(m.ym)}: ${formatIDR(m.buy)}`}
                />
                <div
                  className="w-2 rounded-t bg-indigo-500 transition-all sm:w-2.5"
                  style={{ height: pct(m.sell) }}
                  title={`Penjualan ${monthLabel(m.ym)}: ${formatIDR(m.sell)}`}
                />
              </div>
              <span className="mt-1.5 whitespace-nowrap text-[10px] tabular text-slate-400">
                {monthLabel(m.ym)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
