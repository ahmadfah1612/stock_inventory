import Link from "next/link";
import { listMaterialsWithBalance } from "@/server/materials";
import { MaterialForm } from "@/components/material-form";
import { formatIDR, formatQty } from "@/lib/money";
import { Card, PageHeader, StokKosongBadge } from "@/components/ui";
import { arrow, compare, parseDir, sortHref, type Dir } from "@/lib/sort";

const COLS = {
  name: (r: { brand: string; grade: string }) => `${r.brand} ${r.grade}`,
  qty: (r: { balQty: string }) => Number(r.balQty),
  value: (r: { balValue: string }) => Number(r.balValue),
} as const;
type Col = keyof typeof COLS;
const LABELS: Record<Col, string> = { name: "Nama", qty: "Qty", value: "Nilai" };

export default async function MaterialsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; sort?: string; dir?: string }>;
}) {
  const [allRows, sp] = await Promise.all([listMaterialsWithBalance(), searchParams]);
  const { error } = sp;
  const sort: Col = (sp.sort && sp.sort in COLS ? sp.sort : "name") as Col;
  const dir: Dir = parseDir(sp.dir);
  const rows = [...allRows].sort((a, b) => compare(COLS[sort](a), COLS[sort](b), dir));

  return (
    <div>
      <PageHeader title="Materials" subtitle="Manage material grades and open their stock cards" />

      {error && (
        <p
          role="alert"
          className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {error}
        </p>
      )}

      <div className="mb-6">
        <MaterialForm />
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
        <span className="text-slate-500">Urutkan:</span>
        {(Object.keys(COLS) as Col[]).map((col) => {
          const active = sort === col;
          return (
            <Link
              key={col}
              href={sortHref("/materials", col, sort, dir)}
              aria-current={active ? "true" : undefined}
              className={`rounded-lg border px-3 py-1.5 font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 ${
                active
                  ? "border-indigo-200 bg-indigo-50 text-indigo-700"
                  : "border-slate-200 text-slate-600 hover:bg-slate-100"
              }`}
            >
              {LABELS[col]}
              <span aria-hidden="true">{active ? arrow(true, dir) : ""}</span>
            </Link>
          );
        })}
      </div>

      <Card>
        {rows.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="text-sm font-medium text-slate-900">No materials yet</p>
            <p className="mt-1 text-sm text-slate-500">Add a brand + grade above to begin.</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {rows.map((r) => {
              const empty = Number(r.balQty) === 0;
              return (
                <li key={r.id}>
                  <Link
                    href={`/materials/${r.id}`}
                    className="flex items-center justify-between gap-4 px-4 py-3.5 transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="truncate font-medium text-slate-900">
                        {r.brand} <span className="text-slate-500">{r.grade}</span>
                      </span>
                      {empty && <StokKosongBadge />}
                    </span>
                    <span className="flex shrink-0 items-center gap-3 text-sm tabular">
                      <span className={empty ? "text-slate-400" : "text-slate-700"}>
                        {empty ? "0 Kg" : formatQty(r.balQty)}
                      </span>
                      <span className="hidden font-medium text-slate-900 sm:inline">
                        {formatIDR(r.balValue)}
                      </span>
                      <span aria-hidden="true" className="text-slate-300">›</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
