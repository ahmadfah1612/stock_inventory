import Link from "next/link";
import { listMaterialsWithBalance } from "@/server/materials";
import { MaterialForm } from "@/components/material-form";
import { formatIDR, formatQty } from "@/lib/money";
import { Card, PageHeader } from "@/components/ui";

export default async function MaterialsPage() {
  const rows = await listMaterialsWithBalance();
  return (
    <div>
      <PageHeader title="Materials" subtitle="Manage material grades and open their stock cards" />

      <div className="mb-6">
        <MaterialForm />
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
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-slate-900">
                        {r.brand} <span className="text-slate-500">{r.grade}</span>
                      </span>
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
