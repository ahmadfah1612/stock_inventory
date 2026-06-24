import { formatDate, formatIDR, formatQty } from "@/lib/money";

export type Saldo = { unit: number; harga: number; jumlah: number; asOf: string };

export function AveragePanel({
  action,
  from,
  to,
  saldo,
}: {
  action: string;
  from?: string;
  to?: string;
  saldo: Saldo | null;
}) {
  const inputCls =
    "block rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-2 focus:outline-offset-0 focus:outline-indigo-500";
  const active = Boolean(from || to);

  return (
    <section
      aria-label="Rata-rata saldo"
      className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Rata-rata (Saldo)</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Saldo Unit / Harga / Jumlah pada akhir rentang tanggal. Harga = rata-rata tertimbang.
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

      {saldo === null ? (
        <p className="rounded-lg bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
          Tidak ada transaksi pada rentang ini.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Tile label="Saldo Unit" value={formatQty(saldo.unit)} />
            <Tile label="Harga (rata-rata)" value={formatIDR(saldo.harga)} />
            <Tile label="Saldo Jumlah" value={formatIDR(saldo.jumlah)} />
          </div>
          <p className="mt-3 text-xs text-slate-400">Per transaksi terakhir: {formatDate(saldo.asOf)}</p>
        </>
      )}
    </section>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-semibold tabular text-slate-900">{value}</p>
    </div>
  );
}
