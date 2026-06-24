import { listMaterialsWithBalance } from "@/server/materials";
import { ExportForm, type ExportItem } from "@/components/export-form";
import { PageHeader } from "@/components/ui";

export default async function ExportPage() {
  const rows = await listMaterialsWithBalance();
  const items: ExportItem[] = rows.map((r) => ({
    id: r.id,
    brand: r.brand,
    grade: r.grade,
    inStock: Number(r.balQty) > 0,
  }));

  return (
    <div className="max-w-2xl">
      <PageHeader
        title="Export ke Excel"
        subtitle="Pilih barang yang ingin diekspor. Tiap barang menjadi satu sheet (kartu stok), plus sheet ringkasan."
      />
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 shadow-sm">
        <ExportForm items={items} />
      </div>
    </div>
  );
}
