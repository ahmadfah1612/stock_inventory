"use client";

import { useState } from "react";
import { updateMaterialAction } from "@/server/actions";

const inputCls =
  "block w-full rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-100 shadow-sm placeholder:text-slate-500 focus:border-indigo-500 focus:outline-2 focus:outline-offset-0 focus:outline-indigo-500";

export function EditBarangButton({ id, brand, grade }: { id: string; brand: string; grade: string }) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="cursor-pointer rounded-lg border border-slate-700 px-3 py-2 text-sm font-medium text-slate-200 transition-colors hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
      >
        Edit Barang
      </button>
    );
  }

  return (
    <form
      action={updateMaterialAction}
      onSubmit={(e) => {
        const fd = new FormData(e.currentTarget);
        const nb = String(fd.get("brand") ?? "").trim();
        const ng = String(fd.get("grade") ?? "").trim();
        if (!confirm(`Ubah "${brand} ${grade}" menjadi "${nb} ${ng}"? Berlaku untuk seluruh riwayat barang ini.`)) {
          e.preventDefault();
        }
      }}
      className="flex flex-wrap items-end gap-2 rounded-lg border border-slate-800 bg-slate-900 p-3 shadow-sm"
    >
      <input type="hidden" name="id" value={id} />
      <div className="space-y-1">
        <label htmlFor="edit-brand" className="block text-xs font-medium text-slate-400">Barang</label>
        <input id="edit-brand" name="brand" required defaultValue={brand} className={inputCls} />
      </div>
      <div className="space-y-1">
        <label htmlFor="edit-grade" className="block text-xs font-medium text-slate-400">Kode Barang</label>
        <input id="edit-grade" name="grade" required defaultValue={grade} className={inputCls} />
      </div>
      <div className="flex gap-2">
        <button className="cursor-pointer rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
          Simpan
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="cursor-pointer rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800"
        >
          Batal
        </button>
      </div>
    </form>
  );
}
