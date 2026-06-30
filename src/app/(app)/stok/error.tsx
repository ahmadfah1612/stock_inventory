"use client";

import { useEffect } from "react";

export default function StokError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-6 py-12 text-center">
      <p className="text-sm font-semibold text-red-200">Gagal memuat halaman Stok &amp; HPP</p>
      <p className="mt-2 text-sm text-red-300/80">
        {error.message || "Terjadi kesalahan saat mengambil data dari database."}
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-4 cursor-pointer rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
      >
        Coba lagi
      </button>
    </div>
  );
}
