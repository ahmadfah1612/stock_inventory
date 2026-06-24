import Link from "next/link";
import { listMaterialsWithBalance } from "@/server/materials";
import { monthlyActivity } from "@/server/stats";
import { ActivityChart } from "@/components/activity-chart";
import { formatIDR, formatQty } from "@/lib/money";
import { Card, PageHeader, StatCard, StokKosongBadge } from "@/components/ui";
import { SearchBox, matchesQuery } from "@/components/search-box";
import { ariaSort, arrow, compare, parseDir, sortHref, type Dir } from "@/lib/sort";

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

  const [rows, activity] = await Promise.all([listMaterialsWithBalance(), monthlyActivity(12)]);
  // KPI cards reflect the whole inventory, not the filtered view
  const totalValue = rows.reduce((a, r) => a + Number(r.balValue), 0);
  const outOfStock = rows.filter((r) => Number(r.balQty) === 0).length;
  const sorted = rows
    .filter((r) => matchesQuery(r.brand, r.grade, q))
    .sort((a, b) => compare(COLS[sort](a), COLS[sort](b), dir));
  const shownTotal = sorted.reduce((a, r) => a + Number(r.balValue), 0);

  return (
    <div>
      <PageHeader title="Summary" subtitle="Inventory across all material grades" />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total Inventory Value" value={formatIDR(totalValue)} />
        <StatCard label="Barang" value={String(rows.length)} hint="active materials" />
        <StatCard label="Out of Stock" value={String(outOfStock)} hint="grades at zero" />
      </div>

      <div className="mb-6">
        <ActivityChart data={activity} />
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <SearchBox action="/" q={q} hidden={{ sort, dir }} />
        {q && (
          <span className="text-sm text-slate-500">
            {sorted.length} hasil untuk “{q}”
          </span>
        )}
      </div>

      <Card>
        {rows.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="text-sm font-medium text-slate-900">No materials yet</p>
            <p className="mt-1 text-sm text-slate-500">
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
            <p className="text-sm font-medium text-slate-900">Tidak ada barang cocok “{q}”</p>
            <p className="mt-1 text-sm text-slate-500">Coba kata kunci lain atau reset pencarian.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <SortableTh col="brand" label="Barang" sort={sort} dir={dir} q={q} />
                  <SortableTh col="grade" label="Kode Barang" sort={sort} dir={dir} q={q} />
                  <SortableTh col="qty" label="Qty (Kg)" sort={sort} dir={dir} q={q} align="right" />
                  <SortableTh col="price" label="Price/Kg" sort={sort} dir={dir} q={q} align="right" />
                  <SortableTh col="total" label="Total" sort={sort} dir={dir} q={q} align="right" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sorted.map((r) => {
                  const empty = Number(r.balQty) === 0;
                  return (
                    <tr key={r.id} className="transition-colors hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <Link
                          href={`/materials/${r.id}`}
                          className="font-medium text-indigo-700 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                        >
                          {r.brand}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        <span className="flex items-center gap-2">
                          {r.grade}
                          {empty && <StokKosongBadge />}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right tabular text-slate-900">
                        {empty ? (
                          <span className="text-slate-400">0 Kg</span>
                        ) : (
                          formatQty(r.balQty)
                        )}
                      </td>
                      <td className="px-4 py-3 text-right tabular text-slate-600">
                        {formatIDR(r.avgCost)}
                      </td>
                      <td className="px-4 py-3 text-right tabular font-medium text-slate-900">
                        {formatIDR(r.balValue)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t border-slate-200 bg-slate-50 font-semibold text-slate-900">
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
        className={`inline-flex items-center gap-0.5 rounded hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 ${
          active ? "text-slate-900" : ""
        }`}
      >
        {label}
        <span aria-hidden="true">{arrow(active, dir) || " ↕"}</span>
      </Link>
    </th>
  );
}
