import { formatIDR, formatQty } from "@/lib/money";

export type SideAvg = { count: number; unit: number; harga: number; jumlah: number };

export function AveragePanel({
  action,
  from,
  to,
  buy,
  sell,
}: {
  action: string;
  from?: string;
  to?: string;
  buy: SideAvg;
  sell: SideAvg;
}) {
  const inputCls =
    "block rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-2 focus:outline-offset-0 focus:outline-indigo-500";
  const active = Boolean(from || to);

  return (
    <section
      aria-label="Rata-rata transaksi"
      className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Rata-rata</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Rata-rata Unit / Harga / Jumlah pada rentang tanggal terpilih.
          </p>
        </div>
        <form action={action} method="get" className="flex flex-wrap items-end gap-2">
          <label className="text-xs font-medium text-slate-600">
            Dari tanggal
            <input type="date" name="from" defaultValue={from} className={`mt-1 ${inputCls}`} />
          </label>
          <label className="text-xs font-medium text-slate-600">
            Sampai tanggal
            <input type="date" name="to" defaultValue={to} className={`mt-1 ${inputCls}`} />
          </label>
          <button className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
            Hitung
          </button>
          {active && (
            <a
              href={action}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              Reset
            </a>
          )}
        </form>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <th scope="col" className="px-3 py-2">Jenis</th>
              <th scope="col" className="px-3 py-2 text-right">Transaksi</th>
              <th scope="col" className="px-3 py-2 text-right">Rata-rata Unit</th>
              <th scope="col" className="px-3 py-2 text-right">Rata-rata Harga</th>
              <th scope="col" className="px-3 py-2 text-right">Rata-rata Jumlah</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            <Row label="Pembelian" side={buy} />
            <Row label="Penjualan" side={sell} />
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Row({ label, side }: { label: string; side: SideAvg }) {
  if (side.count === 0) {
    return (
      <tr>
        <td className="px-3 py-2.5 font-medium text-slate-700">{label}</td>
        <td className="px-3 py-2.5 text-right tabular text-slate-400">0</td>
        <td className="px-3 py-2.5 text-right text-slate-400" colSpan={3}>
          Tidak ada transaksi pada rentang ini
        </td>
      </tr>
    );
  }
  return (
    <tr>
      <td className="px-3 py-2.5 font-medium text-slate-700">{label}</td>
      <td className="px-3 py-2.5 text-right tabular text-slate-600">{side.count}</td>
      <td className="px-3 py-2.5 text-right tabular text-slate-900">{formatQty(side.unit)}</td>
      <td className="px-3 py-2.5 text-right tabular text-slate-900">{formatIDR(side.harga)}</td>
      <td className="px-3 py-2.5 text-right tabular font-medium text-slate-900">
        {formatIDR(side.jumlah)}
      </td>
    </tr>
  );
}
