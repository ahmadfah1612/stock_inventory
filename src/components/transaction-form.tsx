"use client";
import { useState } from "react";
import { createTransactionAction } from "@/server/actions";

export function TransactionForm({ materialId, error }: { materialId: string; error?: string }) {
  const [type, setType] = useState("buy");
  return (
    <form action={createTransactionAction} className="max-w-md space-y-3">
      {error && <p className="rounded bg-red-50 p-2 text-sm text-red-700">{error}</p>}
      <input type="hidden" name="materialId" value={materialId} />
      <label className="block text-sm">Tanggal
        <input name="date" type="date" required className="mt-1 w-full border p-2 rounded" />
      </label>
      <label className="block text-sm">Tipe
        <select name="type" value={type} onChange={(e) => setType(e.target.value)} className="mt-1 w-full border p-2 rounded">
          <option value="buy">Buy</option><option value="sell">Sell</option>
          <option value="sample">Sample</option><option value="scrap">Scrap</option>
        </select>
      </label>
      <label className="block text-sm">Qty (Kg)
        <input name="qty" inputMode="decimal" required className="mt-1 w-full border p-2 rounded" />
      </label>
      {type === "buy" && (
        <label className="block text-sm">Harga Beli / Kg
          <input name="unitCost" inputMode="decimal" required className="mt-1 w-full border p-2 rounded" />
        </label>
      )}
      {type === "sell" && (
        <label className="block text-sm">Harga Jual / Kg (opsional)
          <input name="salePrice" inputMode="decimal" className="mt-1 w-full border p-2 rounded" />
        </label>
      )}
      <label className="block text-sm">No SJ/Invoice
        <input name="docNo" className="mt-1 w-full border p-2 rounded" />
      </label>
      <label className="block text-sm">Customer/Supplier
        <input name="counterparty" className="mt-1 w-full border p-2 rounded" />
      </label>
      <button className="rounded bg-black px-4 py-2 text-white">Simpan</button>
    </form>
  );
}
