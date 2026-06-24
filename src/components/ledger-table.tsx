import { formatDate, formatIDR, formatQty } from "@/lib/money";
import { TypeBadge } from "@/components/ui";

type Row = {
  id: string; date: string; type: string; docNo: string | null; counterparty: string | null;
  qty: string; unitCost: string | null; salePrice: string | null;
  cogs: string; revenue: string; profit: string; balQty: string; balValue: string;
};

const th = "px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-400";
const sub = "px-3 py-2 text-right text-xs font-semibold text-slate-400";
const td = "whitespace-nowrap px-3 py-2.5 text-right tabular text-slate-200";

export function LedgerTable({ rows }: { rows: Row[] }) {
  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900 px-6 py-16 text-center shadow-sm">
        <p className="text-sm font-medium text-slate-100">No transactions yet</p>
        <p className="mt-1 text-sm text-slate-400">Record a buy to open this stock card.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900 shadow-sm">
      <table className="w-full min-w-[920px] text-sm">
        <thead>
          <tr className="border-b border-slate-800 bg-slate-800/50 text-left">
            <th scope="col" className={th} rowSpan={2}>Tanggal</th>
            <th scope="col" className={th} rowSpan={2}>No SJ/Invoice</th>
            <th scope="col" className={th} rowSpan={2}>Tipe</th>
            <th scope="col" className={th} rowSpan={2}>Customer</th>
            <th scope="colgroup" className="border-l border-slate-800 px-3 py-2 text-center text-xs font-semibold uppercase tracking-wide text-emerald-300" colSpan={3}>Pembelian</th>
            <th scope="colgroup" className="border-l border-slate-800 px-3 py-2 text-center text-xs font-semibold uppercase tracking-wide text-indigo-300" colSpan={3}>Penjualan</th>
            <th scope="colgroup" className="border-l border-slate-800 px-3 py-2 text-center text-xs font-semibold uppercase tracking-wide text-slate-300" colSpan={3}>Saldo</th>
          </tr>
          <tr className="border-b border-slate-800 bg-slate-800/50">
            {["Unit", "Harga", "Jumlah", "Unit", "Harga", "Jumlah", "Unit", "Harga", "Jumlah"].map(
              (h, i) => (
                <th
                  key={i}
                  scope="col"
                  className={`${sub} ${i % 3 === 0 ? "border-l border-slate-800" : ""}`}
                >
                  {h}
                </th>
              ),
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800">
          {rows.map((r) => {
            const isBuy = r.type === "buy";
            const avg = Number(r.balQty) === 0 ? "0" : String(Number(r.balValue) / Number(r.balQty));
            return (
              <tr key={r.id} className="transition-colors hover:bg-slate-800/50">
                <td className="whitespace-nowrap px-3 py-2.5 text-slate-200">{formatDate(r.date)}</td>
                <td className="whitespace-nowrap px-3 py-2.5 text-slate-400">{r.docNo ?? "—"}</td>
                <td className="px-3 py-2.5"><TypeBadge type={r.type} /></td>
                <td className="px-3 py-2.5 text-slate-200">{r.counterparty ?? "—"}</td>

                <td className={`${td} border-l border-slate-800`}>{isBuy ? formatQty(r.qty) : ""}</td>
                <td className={td}>{isBuy ? formatIDR(r.unitCost ?? 0) : ""}</td>
                <td className={`${td} text-slate-100`}>{isBuy ? formatIDR(Number(r.qty) * Number(r.unitCost ?? 0)) : ""}</td>

                <td className={`${td} border-l border-slate-800`}>{!isBuy ? formatQty(r.qty) : ""}</td>
                <td className={td}>{!isBuy ? formatIDR(r.salePrice ?? r.cogs) : ""}</td>
                <td className={`${td} text-slate-100`}>{!isBuy ? formatIDR(r.revenue !== "0" ? r.revenue : r.cogs) : ""}</td>

                <td className={`${td} border-l border-slate-800`}>{formatQty(r.balQty)}</td>
                <td className={td}>{formatIDR(avg)}</td>
                <td className={`${td} font-medium text-slate-100`}>{formatIDR(r.balValue)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
