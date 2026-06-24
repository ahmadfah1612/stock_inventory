import { importBarangAction } from "@/server/actions";
import { PageHeader } from "@/components/ui";

const inputCls =
  "block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-indigo-500 focus:outline-2 focus:outline-offset-0 focus:outline-indigo-500";

export default async function ImportPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <div className="max-w-xl">
      <PageHeader
        title="Import Barang"
        subtitle="Buat barang baru dari file Excel kartu stok (satu barang per file)."
      />

      <form
        action={importBarangAction}
        encType="multipart/form-data"
        className="space-y-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        {error && (
          <p
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            {error}
          </p>
        )}

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label htmlFor="brand" className="block text-sm font-medium text-slate-700">
              Barang
            </label>
            <input id="brand" name="brand" required placeholder="e.g. Exxon" className={inputCls} />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="grade" className="block text-sm font-medium text-slate-700">
              Kode Barang
            </label>
            <input id="grade" name="grade" required placeholder="e.g. AP03B" className={inputCls} />
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="file" className="block text-sm font-medium text-slate-700">
            File Excel (.xlsx)
          </label>
          <input
            id="file"
            name="file"
            type="file"
            accept=".xlsx"
            required
            className="block w-full text-sm text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-indigo-700 hover:file:bg-indigo-100"
          />
        </div>

        <div className="rounded-lg bg-slate-50 px-4 py-3 text-xs text-slate-500">
          <p className="font-medium text-slate-600">Format yang diharapkan:</p>
          <p className="mt-1">
            Baris 1: Tanggal · No SJ · Buy/Sell/Sample · Customer · Pembelian · Penjualan · Saldo.
            Baris 2: Unit · Harga · Jumlah (×3). Data mulai baris 3. File yang tidak sesuai akan
            ditolak.
          </p>
        </div>

        <div className="flex justify-end">
          <button className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
            Import
          </button>
        </div>
      </form>
    </div>
  );
}
