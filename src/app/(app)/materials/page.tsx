import Link from "next/link";
import { listMaterialsWithBalance } from "@/server/materials";
import { MaterialForm } from "@/components/material-form";
import { formatIDR, formatQty } from "@/lib/money";
import { Card, PageHeader, StokKosongBadge } from "@/components/ui";
import { SearchBox, matchesQuery } from "@/components/search-box";
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
  searchParams: Promise<{ error?: string; sort?: string; dir?: string; q?: string; deleted?: string }>;
}) {
  const [allRows, sp] = await Promise.all([listMaterialsWithBalance(), searchParams]);
  const { error, q, deleted } = sp;
  const sort: Col = (sp.sort && sp.sort in COLS ? sp.sort : "name") as Col;
  const dir: Dir = parseDir(sp.dir);
  const rows = allRows
    .filter((r) => matchesQuery(r.brand, r.grade, q))
    .sort((a, b) => compare(COLS[sort](a), COLS[sort](b), dir));

  return (
    <div>
      <PageHeader title="Materials" subtitle="Manage material grades and open their stock cards" />

      {error && (
        <p
          role="alert"
          className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300"
        >
          {error}
        </p>
      )}
      {deleted && (
        <p
          role="status"
          className="mb-4 rounded-lg border border-emerald-500/30 bg-emerald-500/15 px-3 py-2 text-sm text-emerald-300"
        >
          Barang berhasil dihapus.
        </p>
      )}

      <div className="mb-6">
        <MaterialForm />
      </div>

      <div className="mb-3">
        <SearchBox action="/materials" q={q} hidden={{ sort, dir }} />
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
        <span className="text-slate-400">Urutkan:</span>
        {(Object.keys(COLS) as Col[]).map((col) => {
          const active = sort === col;
          const href =
            sortHref("/materials", col, sort, dir) + (q ? `&q=${encodeURIComponent(q)}` : "");
          return (
            <Link
              key={col}
              href={href}
              aria-current={active ? "true" : undefined}
              className={`rounded-lg border px-3 py-1.5 font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 ${
                active
                  ? "border-indigo-200 bg-indigo-500/15 text-indigo-300"
                  : "border-slate-800 text-slate-300 hover:bg-slate-800"
              }`}
            >
              {LABELS[col]}
              <span aria-hidden="true">{active ? arrow(true, dir) : ""}</span>
            </Link>
          );
        })}
        {q && (
          <span className="ml-auto text-slate-400">
            {rows.length} hasil untuk “{q}”
          </span>
        )}
      </div>

      <Card>
        {rows.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="text-sm font-medium text-slate-100">
              {q ? `Tidak ada barang cocok “${q}”` : "No materials yet"}
            </p>
            <p className="mt-1 text-sm text-slate-400">
              {q ? "Coba kata kunci lain atau reset pencarian." : "Add a brand + grade above to begin."}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-800">
            {rows.map((r) => {
              const empty = Number(r.balQty) === 0;
              return (
                <li key={r.id}>
                  <Link
                    href={`/materials/${r.id}`}
                    className="flex items-center justify-between gap-4 px-4 py-3.5 transition-colors hover:bg-slate-800/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="truncate font-medium text-slate-100">
                        {r.brand} <span className="text-slate-400">{r.grade}</span>
                      </span>
                      {empty && <StokKosongBadge />}
                    </span>
                    <span className="flex shrink-0 items-center gap-3 text-sm tabular">
                      <span className={empty ? "text-slate-500" : "text-slate-200"}>
                        {empty ? "0 Kg" : formatQty(r.balQty)}
                      </span>
                      <span className="hidden font-medium text-slate-100 sm:inline">
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
