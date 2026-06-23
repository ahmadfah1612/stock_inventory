import Link from "next/link";
import { listMaterialsWithBalance } from "@/server/materials";
import { formatIDR, formatQty } from "@/lib/money";

export default async function SummaryPage() {
  const rows = await listMaterialsWithBalance();
  const totalValue = rows.reduce((a, r) => a + Number(r.balValue), 0);
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <Card label="Total Inventory Value" value={formatIDR(totalValue)} />
        <Card label="Grades" value={String(rows.length)} />
        <Card label="Out of Stock" value={String(rows.filter((r) => Number(r.balQty) === 0).length)} />
      </div>
      <table className="w-full border-collapse text-sm">
        <thead><tr className="border-b bg-gray-50 text-left">
          <th className="p-2">Stock</th><th className="p-2">Grade</th>
          <th className="p-2 text-right">Qty (Kg)</th><th className="p-2 text-right">Price/Kg</th>
          <th className="p-2 text-right">Total</th>
        </tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-b hover:bg-gray-50">
              <td className="p-2"><Link href={`/materials/${r.id}`} className="underline">{r.brand}</Link></td>
              <td className="p-2">{r.grade}</td>
              <td className="p-2 text-right">{formatQty(r.balQty)}</td>
              <td className="p-2 text-right">{formatIDR(r.avgCost)}</td>
              <td className="p-2 text-right">{formatIDR(r.balValue)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot><tr className="border-t font-semibold">
          <td className="p-2" colSpan={4}>Total</td>
          <td className="p-2 text-right">{formatIDR(totalValue)}</td>
        </tr></tfoot>
      </table>
    </div>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return <div className="rounded border p-4"><div className="text-xs text-gray-500">{label}</div><div className="text-lg font-semibold">{value}</div></div>;
}
