import { formatDate, formatIDR, formatQty } from "@/lib/money";
import { DateRangePicker } from "@/components/date-range-picker";

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
  const active = Boolean(from || to);

  return (
    <section
      aria-label="Rata-rata saldo"
      className="mb-6 rounded-xl border border-slate-800 bg-slate-900 p-5 shadow-sm"
    >
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-100">Rata-rata (Saldo)</h2>
          <p className="mt-0.5 text-xs text-slate-400">
            Saldo Unit / Harga / Jumlah pada akhir rentang tanggal.
          </p>
        </div>
        <DateRangePicker action={action} from={from} to={to} />
      </div>

      {!active ? (
        <p className="rounded-lg bg-slate-800/50 px-4 py-6 text-center text-sm text-slate-400">
          Pilih tanggal lalu klik Hitung untuk melihat rata-rata saldo.
        </p>
      ) : saldo === null ? (
        <p className="rounded-lg bg-slate-800/50 px-4 py-6 text-center text-sm text-slate-400">
          Tidak ada transaksi pada rentang ini.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Tile label="Saldo Unit" value={formatQty(saldo.unit)} />
            <Tile label="Harga (rata-rata)" value={formatIDR(saldo.harga)} />
            <Tile label="Saldo Jumlah" value={formatIDR(saldo.jumlah)} />
          </div>
          <p className="mt-3 text-xs text-slate-500">Per transaksi terakhir: {formatDate(saldo.asOf)}</p>
        </>
      )}
    </section>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-800/50 px-4 py-3">
      <p className="text-xs font-medium text-slate-400">{label}</p>
      <p className="mt-1 text-lg font-semibold tabular text-slate-100">{value}</p>
    </div>
  );
}
