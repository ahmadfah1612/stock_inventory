import { formatDate, formatIDR, formatQty } from "@/lib/money";

type Row = {
  id: string; date: string; type: string; docNo: string | null; counterparty: string | null;
  qty: string; unitCost: string | null; salePrice: string | null;
  cogs: string; revenue: string; profit: string; balQty: string; balValue: string;
};

export function LedgerTable({ rows }: { rows: Row[] }) {
  return (
    <table className="w-full border-collapse text-xs">
      <thead>
        <tr className="bg-gray-100 text-left">
          <th className="border p-1" rowSpan={2}>Tanggal</th>
          <th className="border p-1" rowSpan={2}>No SJ/Invoice</th>
          <th className="border p-1" rowSpan={2}>Tipe</th>
          <th className="border p-1" rowSpan={2}>Customer</th>
          <th className="border p-1 text-center" colSpan={3}>Pembelian</th>
          <th className="border p-1 text-center" colSpan={3}>Penjualan</th>
          <th className="border p-1 text-center" colSpan={3}>Saldo</th>
          <th className="border p-1" rowSpan={2}>Profit</th>
        </tr>
        <tr className="bg-gray-50">
          {["Unit","Harga","Jumlah","Unit","Harga","Jumlah","Unit","Harga","Jumlah"].map((h, i) => (
            <th key={i} className="border p-1 text-right">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => {
          const isBuy = r.type === "buy";
          const avg = Number(r.balQty) === 0 ? "0" : String(Number(r.balValue) / Number(r.balQty));
          return (
            <tr key={r.id} className="border-b">
              <td className="border p-1">{formatDate(r.date)}</td>
              <td className="border p-1">{r.docNo ?? "-"}</td>
              <td className="border p-1 capitalize">{r.type}</td>
              <td className="border p-1">{r.counterparty ?? "-"}</td>
              <td className="border p-1 text-right">{isBuy ? formatQty(r.qty) : ""}</td>
              <td className="border p-1 text-right">{isBuy ? formatIDR(r.unitCost ?? 0) : ""}</td>
              <td className="border p-1 text-right">{isBuy ? formatIDR(Number(r.qty) * Number(r.unitCost ?? 0)) : ""}</td>
              <td className="border p-1 text-right">{!isBuy ? formatQty(r.qty) : ""}</td>
              <td className="border p-1 text-right">{!isBuy ? formatIDR(r.salePrice ?? r.cogs) : ""}</td>
              <td className="border p-1 text-right">{!isBuy ? formatIDR(r.revenue !== "0" ? r.revenue : r.cogs) : ""}</td>
              <td className="border p-1 text-right">{formatQty(r.balQty)}</td>
              <td className="border p-1 text-right">{formatIDR(avg)}</td>
              <td className="border p-1 text-right">{formatIDR(r.balValue)}</td>
              <td className="border p-1 text-right">{!isBuy && r.revenue !== "0" ? formatIDR(r.profit) : "-"}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
