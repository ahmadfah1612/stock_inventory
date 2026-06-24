import Link from "next/link";
import { listMaterialsWithBalance } from "@/server/materials";
import { NewTransaksiForm } from "@/components/new-transaksi-form";
import { PageHeader } from "@/components/ui";

export default async function TransaksiPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const rows = await listMaterialsWithBalance();
  const materials = rows.map((r) => ({ id: r.id, brand: r.brand, grade: r.grade, balQty: r.balQty }));

  return (
    <div>
      <PageHeader
        title="Transaksi Baru"
        subtitle="Pilih barang dan kode barang, lalu catat buy, sell, sample, atau scrap."
      />
      {materials.length === 0 ? (
        <div className="max-w-lg rounded-xl border border-slate-800 bg-slate-900 px-6 py-16 text-center shadow-sm">
          <p className="text-sm font-medium text-slate-100">Belum ada barang</p>
          <p className="mt-1 text-sm text-slate-400">Tambah barang dulu sebelum mencatat transaksi.</p>
          <Link
            href="/materials"
            className="mt-4 inline-flex rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            Ke Materials
          </Link>
        </div>
      ) : (
        <NewTransaksiForm materials={materials} error={error} />
      )}
    </div>
  );
}
