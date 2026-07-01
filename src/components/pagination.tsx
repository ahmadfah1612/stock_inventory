import Link from "next/link";

export function Pagination({
  page,
  totalPages,
  total,
  rangeStart,
  rangeEnd,
  hrefForPage,
}: {
  page: number;
  totalPages: number;
  total: number;
  rangeStart: number;
  rangeEnd: number;
  hrefForPage: (page: number) => string;
}) {
  if (totalPages <= 1) return null;

  const prev = page > 1 ? page - 1 : null;
  const next = page < totalPages ? page + 1 : null;

  return (
    <div className="flex flex-col gap-3 border-t border-slate-800 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-slate-400">
        Menampilkan{" "}
        <span className="font-medium text-slate-200 tabular">
          {rangeStart}–{rangeEnd}
        </span>{" "}
        dari <span className="font-medium text-slate-200 tabular">{total}</span>
      </p>
      <nav aria-label="Pagination" className="flex items-center gap-1">
        <PageLink href={prev ? hrefForPage(prev) : undefined} label="Sebelumnya" disabled={!prev} />
        <span className="px-3 text-sm text-slate-400 tabular">
          Halaman <span className="font-medium text-slate-200">{page}</span> / {totalPages}
        </span>
        <PageLink href={next ? hrefForPage(next) : undefined} label="Berikutnya" disabled={!next} />
      </nav>
    </div>
  );
}

function PageLink({ href, label, disabled }: { href?: string; label: string; disabled: boolean }) {
  const className =
    "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600";

  if (disabled || !href) {
    return (
      <span
        aria-disabled="true"
        className={`${className} cursor-not-allowed text-slate-600`}
      >
        {label}
      </span>
    );
  }

  return (
    <Link href={href} className={`${className} border border-slate-700 text-slate-200 hover:bg-slate-800`}>
      {label}
    </Link>
  );
}
