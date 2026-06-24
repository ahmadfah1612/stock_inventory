import Link from "next/link";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { listMaterialsWithBalance } from "@/server/materials";
import { monthlyActivity, recentTransactions, leakageTotal } from "@/server/stats";
import { ActivityChart } from "@/components/activity-chart";
import { RecentTransactions } from "@/components/recent-transactions";
import { TopBarang } from "@/components/top-barang";
import { formatIDR, formatQty } from "@/lib/money";
import { Card, PageHeader, StatCard, StokKosongBadge } from "@/components/ui";
import { SearchBox, matchesQuery } from "@/components/search-box";
import { ariaSort, arrow, compare, parseDir, sortHref, type Dir } from "@/lib/sort";

const monthLabel = (ym: string) => format(new Date(`${ym}-01T00:00:00`), "MMMM yyyy", { locale: idLocale });

const COLS = {
  brand: (r: { brand: string }) => r.brand,
  grade: (r: { grade: string }) => r.grade,
  qty: (r: { balQty: string }) => Number(r.balQty),
  price: (r: { avgCost: string }) => Number(r.avgCost),
  total: (r: { balValue: string }) => Number(r.balValue),
} as const;
type Col = keyof typeof COLS;

export default async function SummaryPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string; dir?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const sort: Col = (sp.sort && sp.sort in COLS ? sp.sort : "brand") as Col;
  const dir: Dir = parseDir(sp.dir);
  const q = sp.q;

  const [rows, activity, recent, leakage] = await Promise.all([
    listMaterialsWithBalance(),
    monthlyActivity(12),
    recentTransactions(8),
    leakageTotal(),
  ]);
  // KPI cards reflect the whole inventory, not the filtered view
  const totalValue = rows.reduce((a, r) => a + Number(r.balValue), 0);
  const outOfStock = rows.filter((r) => Number(r.balQty) === 0).length;
  const sorted = rows
    .filter((r) => matchesQuery(r.brand, r.grade, q))
    .sort((a, b) => compare(COLS[sort](a), COLS[sort](b), dir));
  const shownTotal = sorted.reduce((a, r) => a + Number(r.balValue), 0);

  const cur = activity.at(-1);
  const prev = activity.at(-2);
  const top = rows
    .filter((r) => Number(r.balValue) > 0)
    .sort((a, b) => Number(b.balValue) - Number(a.balValue))
    .slice(0, 5)
    .map((r) => ({ id: r.id, brand: r.brand, grade: r.grade, value: Number(r.balValue) }));

  return (
    <div>
      <PageHeader title="Summary" subtitle="Inventory across all material grades" />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Inventory Value" value={formatIDR(totalValue)} />
        <StatCard label="Barang" value={String(rows.length)} hint="active materials" />
        <StatCard label="Out of Stock" value={String(outOfStock)} hint="grades at zero" />
        <StatCard label="Sample + Scrap" value={formatIDR(leakage)} hint="nilai barang keluar gratis" />
      </div>

      {cur && (
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <MonthCard label="Pembelian" month={cur.ym} value={cur.buy} prev={prev?.buy} />
          <MonthCard label="Penjualan" month={cur.ym} value={cur.sell} prev={prev?.sell} />
        </div>
      )}

      <div className="mb-6">
        <ActivityChart data={activity} />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <TopBarang items={top} />
        <RecentTransactions rows={recent} />
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <SearchBox action="/" q={q} hidden={{ sort, dir }} />
        {q && (
          <span className="text-sm text-slate-400">
            {sorted.length} hasil untuk “{q}”
          </span>
        )}
      </div>

      <Card>
        {rows.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="text-sm font-medium text-slate-100">No materials yet</p>
            <p className="mt-1 text-sm text-slate-400">
              Add a material grade to start tracking stock.
            </p>
            <Link
              href="/materials"
              className="mt-4 inline-flex rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              Go to Materials
            </Link>
          </div>
        ) : sorted.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="text-sm font-medium text-slate-100">Tidak ada barang cocok “{q}”</p>
            <p className="mt-1 text-sm text-slate-400">Coba kata kunci lain atau reset pencarian.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-800/50 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                  <SortableTh col="brand" label="Barang" sort={sort} dir={dir} q={q} />
                  <SortableTh col="grade" label="Kode Barang" sort={sort} dir={dir} q={q} />
                  <SortableTh col="qty" label="Qty (Kg)" sort={sort} dir={dir} q={q} align="right" />
                  <SortableTh col="price" label="Price/Kg" sort={sort} dir={dir} q={q} align="right" />
                  <SortableTh col="total" label="Total" sort={sort} dir={dir} q={q} align="right" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {sorted.map((r) => {
                  const empty = Number(r.balQty) === 0;
                  return (
                    <tr key={r.id} className="transition-colors hover:bg-slate-800/50">
                      <td className="px-4 py-3">
                        <Link
                          href={`/materials/${r.id}`}
                          className="font-medium text-indigo-300 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                        >
                          {r.brand}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-slate-300">
                        <span className="flex items-center gap-2">
                          {r.grade}
                          {empty && <StokKosongBadge />}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right tabular text-slate-100">
                        {empty ? (
                          <span className="text-slate-500">0 Kg</span>
                        ) : (
                          formatQty(r.balQty)
                        )}
                      </td>
                      <td className="px-4 py-3 text-right tabular text-slate-300">
                        {formatIDR(r.avgCost)}
                      </td>
                      <td className="px-4 py-3 text-right tabular font-medium text-slate-100">
                        {formatIDR(r.balValue)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t border-slate-800 bg-slate-800/50 font-semibold text-slate-100">
                  <td className="px-4 py-3" colSpan={4}>
                    {q ? "Total (hasil pencarian)" : "Total"}
                  </td>
                  <td className="px-4 py-3 text-right tabular">{formatIDR(shownTotal)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

function MonthCard({
  label,
  month,
  value,
  prev,
}: {
  label: string;
  month: string;
  value: number;
  prev?: number;
}) {
  const delta = prev != null && prev > 0 ? ((value - prev) / prev) * 100 : null;
  const up = delta != null && delta >= 0;
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-400">
          {label} <span className="text-slate-500">· {monthLabel(month)}</span>
        </p>
        {delta != null && (
          <span
            className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium ${
              up ? "bg-emerald-500/15 text-emerald-300" : "bg-rose-500/15 text-rose-300"
            }`}
          >
            {up ? "▲" : "▼"} {Math.abs(delta).toFixed(0)}%
          </span>
        )}
      </div>
      <p className="mt-1.5 text-2xl font-semibold tracking-tight text-slate-100 tabular">
        {formatIDR(value)}
      </p>
      <p className="mt-1 text-xs text-slate-500">vs bulan sebelumnya</p>
    </div>
  );
}

function SortableTh({
  col,
  label,
  sort,
  dir,
  q,
  align = "left",
}: {
  col: Col;
  label: string;
  sort: Col;
  dir: Dir;
  q?: string;
  align?: "left" | "right";
}) {
  const active = sort === col;
  const href = sortHref("/", col, sort, dir) + (q ? `&q=${encodeURIComponent(q)}` : "");
  return (
    <th
      scope="col"
      aria-sort={ariaSort(active, dir)}
      className={`px-4 py-3 ${align === "right" ? "text-right" : "text-left"}`}
    >
      <Link
        href={href}
        className={`inline-flex items-center gap-0.5 rounded hover:text-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 ${
          active ? "text-slate-100" : ""
        }`}
      >
        {label}
        <span aria-hidden="true">{arrow(active, dir) || " ↕"}</span>
      </Link>
    </th>
  );
}
