import { createMaterialAction } from "@/server/actions";

const inputCls =
  "block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-indigo-500 focus:outline-2 focus:outline-offset-0 focus:outline-indigo-500";

export function MaterialForm() {
  return (
    <form
      action={createMaterialAction}
      className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-end"
    >
      <div className="flex-1 space-y-1.5">
        <label htmlFor="brand" className="block text-sm font-medium text-slate-700">
          Barang
        </label>
        <input id="brand" name="brand" required placeholder="e.g. Exxon" className={inputCls} />
      </div>
      <div className="flex-1 space-y-1.5">
        <label htmlFor="grade" className="block text-sm font-medium text-slate-700">
          Kode Barang
        </label>
        <input id="grade" name="grade" required placeholder="e.g. AP03B" className={inputCls} />
      </div>
      <button className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
        + Tambah
      </button>
    </form>
  );
}
