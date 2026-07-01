"use client";

import { useMemo, useState } from "react";
import { createTransactionAction } from "@/server/actions";

const inputCls =
  "block w-full rounded-lg border border-slate-700 px-3 py-2.5 text-sm text-slate-100 shadow-sm placeholder:text-slate-500 focus:border-indigo-500 focus:outline-2 focus:outline-offset-0 focus:outline-indigo-500";
const labelCls = "block text-sm font-medium text-slate-200";

export type PickItem = { id: string; brand: string; grade: string; balQty: string };

export function NewTransaksiForm({ materials, error }: { materials: PickItem[]; error?: string }) {
  const [brand, setBrand] = useState("");
  const [grade, setGrade] = useState("");
  const [type, setType] = useState("buy");

  const brands = useMemo(
    () => Array.from(new Set(materials.map((m) => m.brand))).sort((a, b) => a.localeCompare(b)),
    [materials],
  );
  const grades = useMemo(
    () =>
      materials
        .filter((m) => m.brand === brand)
        .map((m) => m.grade)
        .sort((a, b) => a.localeCompare(b)),
    [materials, brand],
  );
  const selected = useMemo(
    () => materials.find((m) => m.brand === brand && m.grade === grade),
    [materials, brand, grade],
  );

  return (
    <form
      action={createTransactionAction}
      className="max-w-lg space-y-5 rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-sm"
    >
      {error && (
        <p
          role="alert"
          className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300"
        >
          {error}
        </p>
      )}

      <input type="hidden" name="returnTo" value="/transaksi" />

      {/* Step 1: pick barang + kode barang */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="brand" className={labelCls}>Barang</label>
          <select
            id="brand"
            value={brand}
            onChange={(e) => {
              setBrand(e.target.value);
              setGrade("");
            }}
            className={inputCls}
          >
            <option value="">— Pilih barang —</option>
            {brands.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <label htmlFor="grade" className={labelCls}>Kode Barang</label>
          <select
            id="grade"
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
            disabled={!brand}
            className={`${inputCls} disabled:cursor-not-allowed disabled:opacity-50`}
          >
            <option value="">{brand ? "— Pilih kode barang —" : "Pilih barang dulu"}</option>
            {grades.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>
      </div>

      {!selected ? (
        <p className="rounded-lg bg-slate-800/50 px-4 py-6 text-center text-sm text-slate-400">
          Pilih barang dan kode barang dulu untuk mulai input transaksi.
        </p>
      ) : (
        <>
          <p className="rounded-lg bg-slate-800/50 px-4 py-2.5 text-sm text-slate-300">
            {selected.brand} <span className="text-slate-400">{selected.grade}</span>
            <span className="text-slate-500"> · saldo {selected.balQty} Kg</span>
          </p>
          <input type="hidden" name="materialId" value={selected.id} />

          {/* Step 2: same fields as Transaksi Baru */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="date" className={labelCls}>Tanggal</label>
              <input id="date" name="date" type="date" required className={inputCls} />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="type" className={labelCls}>Tipe</label>
              <select
                id="type"
                name="type"
                value={type}
                onChange={(e) => setType(e.target.value)}
                className={inputCls}
              >
                <option value="buy">Buy — masuk</option>
                <option value="sell">Sell — keluar</option>
                <option value="sample">Sample — keluar</option>
                <option value="scrap">Scrap — keluar</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="qty" className={labelCls}>Qty (Kg)</label>
              <input id="qty" name="qty" inputMode="decimal" required placeholder="0" className={inputCls} />
            </div>
            {type === "buy" && (
              <div className="space-y-1.5">
                <label htmlFor="unitCost" className={labelCls}>Harga Beli / Kg</label>
                <input id="unitCost" name="unitCost" inputMode="decimal" required placeholder="0" className={inputCls} />
              </div>
            )}
            {type === "sell" && (
              <div className="space-y-1.5">
                <label htmlFor="salePrice" className={labelCls}>
                  Harga Jual / Kg <span className="font-normal text-slate-500">(opsional)</span>
                </label>
                <input id="salePrice" name="salePrice" inputMode="decimal" placeholder="0" className={inputCls} />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="docNo" className={labelCls}>No SJ/Invoice</label>
              <input id="docNo" name="docNo" className={inputCls} placeholder="—" />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="counterparty" className={labelCls}>Customer / Supplier</label>
              <input id="counterparty" name="counterparty" className={inputCls} placeholder="—" />
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button className="cursor-pointer rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
              Simpan
            </button>
          </div>
        </>
      )}
    </form>
  );
}
