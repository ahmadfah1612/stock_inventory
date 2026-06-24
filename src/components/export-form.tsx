"use client";

import { useState } from "react";

export type ExportItem = { id: string; brand: string; grade: string; inStock: boolean };

export function ExportForm({ items }: { items: ExportItem[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const allChecked = items.length > 0 && selected.size === items.length;
  const toggle = (id: string) =>
    setSelected((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  const setAll = (on: boolean) => setSelected(on ? new Set(items.map((i) => i.id)) : new Set());

  return (
    <form action="/export/download" method="post">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-200">
          <input
            type="checkbox"
            checked={allChecked}
            onChange={(e) => setAll(e.target.checked)}
            className="h-4 w-4 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500"
          />
          Pilih semua ({items.length})
        </label>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setAll(true)}
            className="cursor-pointer rounded-lg border border-slate-800 px-3 py-1.5 text-sm font-medium text-slate-300 hover:bg-slate-800"
          >
            Semua
          </button>
          <button
            type="button"
            onClick={() => setSelected(new Set(items.filter((i) => i.inStock).map((i) => i.id)))}
            className="cursor-pointer rounded-lg border border-slate-800 px-3 py-1.5 text-sm font-medium text-slate-300 hover:bg-slate-800"
          >
            Hanya ada stok
          </button>
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto rounded-xl border border-slate-800">
        <ul className="divide-y divide-slate-800">
          {items.map((i) => (
            <li key={i.id}>
              <label className="flex cursor-pointer items-center gap-3 px-4 py-2.5 hover:bg-slate-800/50">
                <input
                  type="checkbox"
                  name="id"
                  value={i.id}
                  checked={selected.has(i.id)}
                  onChange={() => toggle(i.id)}
                  className="h-4 w-4 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="flex-1 text-sm text-slate-100">
                  {i.brand} <span className="text-slate-400">{i.grade}</span>
                </span>
                {!i.inStock && (
                  <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-400">
                    Stok Kosong
                  </span>
                )}
              </label>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <p className="text-sm text-slate-400">{selected.size} barang dipilih</p>
        <button
          type="submit"
          disabled={selected.size === 0}
          className="cursor-pointer rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          Export ke Excel
        </button>
      </div>
    </form>
  );
}
