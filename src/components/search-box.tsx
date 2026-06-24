import Link from "next/link";

export function SearchBox({
  action,
  q,
  hidden = {},
}: {
  action: string;
  q?: string;
  hidden?: Record<string, string>;
}) {
  return (
    <form action={action} method="get" role="search" className="flex items-center gap-2">
      {Object.entries(hidden).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <div className="relative flex-1 sm:max-w-xs">
        <span aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
          ⌕
        </span>
        <input
          name="q"
          type="search"
          defaultValue={q}
          placeholder="Cari barang…"
          aria-label="Cari barang"
          className="block w-full rounded-lg border border-slate-700 py-2 pl-8 pr-3 text-sm text-slate-100 shadow-sm placeholder:text-slate-500 focus:border-indigo-500 focus:outline-2 focus:outline-offset-0 focus:outline-indigo-500"
        />
      </div>
      <button className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
        Cari
      </button>
      {q && (
        <Link
          href={action}
          className="rounded-lg border border-slate-800 px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800"
        >
          Reset
        </Link>
      )}
    </form>
  );
}

export function matchesQuery(brand: string, grade: string, q?: string): boolean {
  if (!q) return true;
  return `${brand} ${grade}`.toLowerCase().includes(q.toLowerCase());
}
