import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getLowStockThreshold } from "@/server/settings";
import { updateLowStockThresholdAction } from "@/server/actions";
import { PageHeader } from "@/components/ui";

const inputCls =
  "block w-full rounded-lg border border-slate-700 px-3 py-2.5 text-sm text-slate-100 shadow-sm placeholder:text-slate-500 focus:border-indigo-500 focus:outline-2 focus:outline-offset-0 focus:outline-indigo-500";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "admin") redirect("/");

  const [threshold, { error, ok }] = await Promise.all([getLowStockThreshold(), searchParams]);

  return (
    <div className="max-w-xl">
      <PageHeader title="Pengaturan" subtitle="Konfigurasi aplikasi. Hanya admin." />

      {error && (
        <p role="alert" className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}
      {ok && (
        <p role="status" className="mb-4 rounded-lg border border-emerald-500/30 bg-emerald-500/15 px-3 py-2 text-sm text-emerald-300">
          {ok}
        </p>
      )}

      <form action={updateLowStockThresholdAction} className="space-y-4 rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-sm">
        <div>
          <h2 className="text-sm font-semibold text-slate-100">Ambang Stok Menipis</h2>
          <p className="mt-0.5 text-xs text-slate-400">
            Barang dengan saldo di bawah angka ini (dan masih &gt; 0) ditandai sebagai stok menipis di Summary.
          </p>
        </div>
        <div className="space-y-1.5">
          <label htmlFor="threshold" className="block text-sm font-medium text-slate-200">
            Threshold (Kg)
          </label>
          <input
            id="threshold"
            name="threshold"
            type="number"
            min={1}
            step="any"
            required
            defaultValue={threshold}
            className={inputCls}
          />
        </div>
        <div className="flex justify-end">
          <button className="cursor-pointer rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
            Simpan
          </button>
        </div>
      </form>
    </div>
  );
}
