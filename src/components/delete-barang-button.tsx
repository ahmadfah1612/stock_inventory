"use client";

import { deleteMaterialAction } from "@/server/actions";

export function DeleteBarangButton({ id, label }: { id: string; label: string }) {
  return (
    <form
      action={deleteMaterialAction}
      onSubmit={(e) => {
        if (!confirm(`Hapus "${label}" beserta seluruh riwayat transaksinya? Tindakan ini tidak bisa dibatalkan.`)) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        className="rounded-lg border border-red-500/40 px-3 py-2 text-sm font-medium text-red-300 transition-colors hover:bg-red-500/100/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
      >
        Hapus Barang
      </button>
    </form>
  );
}
