import Link from "next/link";
import { customerReport, supplierReport, type ProductLine } from "@/server/report";
import { PageHeader, StatCard, Card } from "@/components/ui";
import { SearchBox } from "@/components/search-box";
import { formatIDR, formatQty, formatDate } from "@/lib/money";
import { compare, parseDir, arrow, type Dir } from "@/lib/sort";

type Tab = "customer" | "supplier";

const CUST_COLS = {
  name: (r: { name: string }) => r.name,
  txns: (r: { txns: number }) => r.txns,
  qty: (r: { qty: number }) => r.qty,
  revenue: (r: { revenue: number }) => r.revenue,
  last: (r: { last: string }) => r.last,
} as const;

const SUPP_COLS = {
  name: (r: { name: string }) => r.name,
  txns: (r: { txns: number }) => r.txns,
  qty: (r: { qty: number }) => r.qty,
  totalBuy: (r: { totalBuy: number }) => r.totalBuy,
  avgPrice: (r: { avgPrice: number }) => r.avgPrice,
  last: (r: { last: string }) => r.last,
} as const;

export default async function ReportPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; sort?: string; dir?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const tab: Tab = sp.tab === "supplier" ? "supplier" : "customer";
  const dir: Dir = parseDir(sp.dir);
  const q = sp.q?.trim().toLowerCase();

  const href = (next: { tab?: Tab; sort?: string; dir?: Dir; q?: string }) => {
    const p = new URLSearchParams();
    p.set("tab", next.tab ?? tab);
    if (next.sort) p.set("sort", next.sort);
    if (next.dir) p.set("dir", next.dir);
    if (next.q ?? q) p.set("q", (next.q ?? q)!);
    return `/report?${p.toString()}`;
  };

  return (
    <div>
      <PageHeader title="Report" subtitle="Analisa penjualan per customer dan pembelian per supplier." />

      {/* Tabs */}
      <div className="mb-6 flex gap-1 border-b border-slate-800">
        <TabLink label="Customer" active={tab === "customer"} href={href({ tab: "customer", sort: undefined, dir: undefined, q: undefined })} />
        <TabLink label="Supplier" active={tab === "supplier"} href={href({ tab: "supplier", sort: undefined, dir: undefined, q: undefined })} />
      </div>

      {tab === "customer" ? (
        <CustomerView sort={sp.sort} dir={dir} q={q} href={href} />
      ) : (
        <SupplierView sort={sp.sort} dir={dir} q={q} href={href} />
      )}
    </div>
  );
}

function TabLink({ label, active, href }: { label: string; active: boolean; href: string }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
        active
          ? "border-indigo-500 text-indigo-300"
          : "border-transparent text-slate-400 hover:text-slate-200"
      }`}
    >
      {label}
    </Link>
  );
}

type HrefFn = (next: { tab?: Tab; sort?: string; dir?: Dir; q?: string }) => string;

function SortBar({
  fields,
  sort,
  dir,
  href,
}: {
  fields: { key: string; label: string }[];
  sort: string;
  dir: Dir;
  href: HrefFn;
}) {
  return (
    <div className="mb-3 flex flex-wrap items-center gap-1.5 text-xs">
      <span className="text-slate-500">Urutkan:</span>
      {fields.map((f) => {
        const active = sort === f.key;
        const nextDir: Dir = active && dir === "desc" ? "asc" : "desc";
        return (
          <Link
            key={f.key}
            href={href({ sort: f.key, dir: nextDir })}
            className={`rounded-md px-2 py-1 font-medium transition-colors ${
              active ? "bg-indigo-500/15 text-indigo-300" : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
            }`}
          >
            {f.label}
            {arrow(active, dir)}
          </Link>
        );
      })}
    </div>
  );
}

function TopBars({ title, items }: { title: string; items: { name: string; value: number }[] }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <Card className="p-5">
      <h2 className="mb-4 text-sm font-semibold text-slate-100">{title}</h2>
      {items.length === 0 ? (
        <p className="text-sm text-slate-400">Belum ada data.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((i) => (
            <li key={i.name}>
              <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                <span className="truncate text-slate-200">{i.name}</span>
                <span className="shrink-0 tabular text-slate-300">{formatIDR(i.value)}</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-indigo-500"
                  style={{ width: `${Math.max(2, (i.value / max) * 100).toFixed(1)}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function ProductDetail({ products }: { products: ProductLine[] }) {
  return (
    <div className="mt-3 overflow-x-auto rounded-lg border border-slate-800">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-800/50 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
            <th className="px-3 py-2">Barang</th>
            <th className="px-3 py-2 text-right">Qty</th>
            <th className="px-3 py-2 text-right">Nilai</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800">
          {products.map((p) => (
            <tr key={p.name}>
              <td className="px-3 py-2 text-slate-200">{p.name}</td>
              <td className="px-3 py-2 text-right tabular text-slate-300">{formatQty(p.qty)}</td>
              <td className="px-3 py-2 text-right tabular text-slate-100">{formatIDR(p.value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-slate-500">{label}</p>
      <p className="tabular text-sm font-medium text-slate-100">{value}</p>
    </div>
  );
}

async function CustomerView({
  sort,
  dir,
  q,
  href,
}: {
  sort?: string;
  dir: Dir;
  q?: string;
  href: HrefFn;
}) {
  const { rows, kpi } = await customerReport();
  const sortKey = (sort && sort in CUST_COLS ? sort : "revenue") as keyof typeof CUST_COLS;
  const filtered = rows
    .filter((r) => !q || r.name.toLowerCase().includes(q))
    .sort((a, b) => compare(CUST_COLS[sortKey](a), CUST_COLS[sortKey](b), dir));
  const topRevenue = [...rows].sort((a, b) => b.revenue - a.revenue).slice(0, 5).map((r) => ({ name: r.name, value: r.revenue }));

  return (
    <>
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total Customer" value={String(kpi.customers)} />
        <StatCard label="Total Revenue" value={formatIDR(kpi.revenue)} />
        <StatCard label="Total Qty Terjual" value={formatQty(kpi.qty)} />
      </div>

      <div className="mb-6">
        <TopBars title="Top 5 Customer — Revenue" items={topRevenue} />
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <SearchBox action="/report" q={q} hidden={{ tab: "customer", sort: sortKey, dir }} />
        {q && <span className="text-sm text-slate-400">{filtered.length} hasil untuk “{q}”</span>}
      </div>

      <SortBar
        fields={[
          { key: "revenue", label: "Revenue" },
          { key: "qty", label: "Qty" },
          { key: "txns", label: "Transaksi" },
          { key: "last", label: "Terakhir" },
          { key: "name", label: "Nama" },
        ]}
        sort={sortKey}
        dir={dir}
        href={href}
      />

      {filtered.length === 0 ? (
        <Card className="px-6 py-16 text-center">
          <p className="text-sm text-slate-400">Tidak ada data customer.</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((r) => (
            <details key={r.name} className="group rounded-xl border border-slate-800 bg-slate-900 shadow-sm">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-100">{r.name}</p>
                  <p className="text-xs text-slate-500">{r.txns} transaksi · terakhir {formatDate(r.last)}</p>
                </div>
                <div className="flex shrink-0 items-center gap-5">
                  <Stat label="Qty" value={formatQty(r.qty)} />
                  <Stat label="Revenue" value={formatIDR(r.revenue)} />
                  <span aria-hidden="true" className="text-slate-500 transition-transform group-open:rotate-180">▾</span>
                </div>
              </summary>
              <div className="border-t border-slate-800 px-5 pb-5 pt-1">
                <ProductDetail products={r.products} />
              </div>
            </details>
          ))}
        </div>
      )}
    </>
  );
}

async function SupplierView({
  sort,
  dir,
  q,
  href,
}: {
  sort?: string;
  dir: Dir;
  q?: string;
  href: HrefFn;
}) {
  const { rows, kpi } = await supplierReport();
  const sortKey = (sort && sort in SUPP_COLS ? sort : "totalBuy") as keyof typeof SUPP_COLS;
  const filtered = rows
    .filter((r) => !q || r.name.toLowerCase().includes(q))
    .sort((a, b) => compare(SUPP_COLS[sortKey](a), SUPP_COLS[sortKey](b), dir));
  const topBuy = [...rows].sort((a, b) => b.totalBuy - a.totalBuy).slice(0, 5).map((r) => ({ name: r.name, value: r.totalBuy }));

  return (
    <>
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Supplier" value={String(kpi.suppliers)} />
        <StatCard label="Total Qty Beli" value={formatQty(kpi.qty)} />
        <StatCard label="Total Pembelian" value={formatIDR(kpi.totalBuy)} />
        <StatCard label="Harga Beli Rata-rata" value={formatIDR(kpi.avgPrice)} hint="per Kg" />
      </div>

      <div className="mb-6">
        <TopBars title="Top 5 Supplier — Total Pembelian" items={topBuy} />
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <SearchBox action="/report" q={q} hidden={{ tab: "supplier", sort: sortKey, dir }} />
        {q && <span className="text-sm text-slate-400">{filtered.length} hasil untuk “{q}”</span>}
      </div>

      <SortBar
        fields={[
          { key: "totalBuy", label: "Total Beli" },
          { key: "qty", label: "Qty" },
          { key: "avgPrice", label: "Harga Avg" },
          { key: "txns", label: "Transaksi" },
          { key: "last", label: "Terakhir" },
          { key: "name", label: "Nama" },
        ]}
        sort={sortKey}
        dir={dir}
        href={href}
      />

      {filtered.length === 0 ? (
        <Card className="px-6 py-16 text-center">
          <p className="text-sm text-slate-400">Tidak ada data supplier.</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((r) => (
            <details key={r.name} className="group rounded-xl border border-slate-800 bg-slate-900 shadow-sm">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-100">{r.name}</p>
                  <p className="text-xs text-slate-500">{r.txns} transaksi · terakhir {formatDate(r.last)}</p>
                </div>
                <div className="flex shrink-0 items-center gap-5">
                  <Stat label="Qty" value={formatQty(r.qty)} />
                  <Stat label="Total Beli" value={formatIDR(r.totalBuy)} />
                  <Stat label="Harga Avg" value={formatIDR(r.avgPrice)} />
                  <span aria-hidden="true" className="text-slate-500 transition-transform group-open:rotate-180">▾</span>
                </div>
              </summary>
              <div className="border-t border-slate-800 px-5 pb-5 pt-1">
                <ProductDetail products={r.products} />
              </div>
            </details>
          ))}
        </div>
      )}
    </>
  );
}
