import Link from "next/link";
import { listMaterialsWithBalance } from "@/server/materials";
import { formatIDR, formatQty } from "@/lib/money";
import { Card, PageHeader, StatCard, StokKosongBadge } from "@/components/ui";

export default async function SummaryPage() {
  const rows = await listMaterialsWithBalance();
  const totalValue = rows.reduce((a, r) => a + Number(r.balValue), 0);
  const outOfStock = rows.filter((r) => Number(r.balQty) === 0).length;

  return (
    <div>
      <PageHeader title="Summary" subtitle="Inventory across all material grades" />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total Inventory Value" value={formatIDR(totalValue)} />
        <StatCard label="Grades" value={String(rows.length)} hint="active materials" />
        <StatCard label="Out of Stock" value={String(outOfStock)} hint="grades at zero" />
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
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th scope="col" className="px-4 py-3">Stock</th>
                  <th scope="col" className="px-4 py-3">Grade</th>
                  <th scope="col" className="px-4 py-3 text-right">Qty (Kg)</th>
                  <th scope="col" className="px-4 py-3 text-right">Price/Kg</th>
                  <th scope="col" className="px-4 py-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((r) => {
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
                    Total
                  </td>
                  <td className="px-4 py-3 text-right tabular">{formatIDR(totalValue)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
