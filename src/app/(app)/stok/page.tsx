import Link from "next/link";
import {
  allMutations,
  availableMonths,
  currentYm,
  itemHppSummary,
  monthKpis,
  monthlyHppTrend,
  monthlyMutations,
} from "@/server/hpp-report";
import { HppMutationTables } from "@/components/hpp-mutation-table";
import { MonthPicker } from "@/components/month-picker";
import { labelYm } from "@/lib/month";
import { Card, PageHeader, StatCard } from "@/components/ui";
import { formatIDR, formatQty } from "@/lib/money";

export const dynamic = "force-dynamic";

type Tab = "kartu" | "bulanan" | "item";

export default async function StokPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; month?: string }>;
}) {
  const sp = await searchParams;
  const tab: Tab =
    sp.tab === "kartu" ? "kartu" : sp.tab === "item" ? "item" : "bulanan";

  const months = await availableMonths();
  const month = sp.month && months.includes(sp.month) ? sp.month : months[0] ?? currentYm();

  const href = (next: { tab?: Tab; month?: string }) => {
    const p = new URLSearchParams();
    p.set("tab", next.tab ?? tab);
    p.set("month", next.month ?? month);
    return `/stok?${p.toString()}`;
  };

  const kpi = await monthKpis(month);

  return (
    <div>
      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          title="Sistem stok — metode perpetual"
          subtitle="Laporan HPP dan mutasi stok berdasarkan rata-rata bergerak"
        />
        <MonthPicker action="/stok" month={month} months={months} hidden={{ tab }} />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total HPP bulan ini" value={formatIDR(kpi.totalHpp)} hint={labelYm(month)} />
        <StatCard label="Pembelian masuk" value={formatIDR(kpi.pembelianMasuk)} hint="nilai pembelian" />
        <StatCard label="Nilai stok akhir" value={formatIDR(kpi.nilaiStokAkhir)} hint="per akhir bulan" />
        <StatCard label="Jumlah item" value={String(kpi.jumlahItem)} hint="item dengan stok > 0" />
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <PillTab
          label="Kartu stok (mutasi)"
          active={tab === "kartu"}
          href={href({ tab: "kartu" })}
        />
        <PillTab
          label="Laporan HPP bulanan"
          active={tab === "bulanan"}
          href={href({ tab: "bulanan" })}
        />
        <PillTab
          label="Ringkasan HPP per item"
          active={tab === "item"}
          href={href({ tab: "item" })}
        />
      </div>

      {tab === "kartu" && <KartuTab />}
      {tab === "bulanan" && <BulananTab month={month} />}
      {tab === "item" && <ItemTab month={month} />}
    </div>
  );
}

function PillTab({ label, active, href }: { label: string; active: boolean; href: string }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`rounded-full px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 ${
        active
          ? "bg-indigo-500/20 text-indigo-300 ring-1 ring-inset ring-indigo-500/30"
          : "bg-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
      }`}
    >
      {label}
    </Link>
  );
}

async function KartuTab() {
  const groups = await allMutations();
  return <HppMutationTables groups={groups} />;
}

async function BulananTab({ month }: { month: string }) {
  const [groups, trend] = await Promise.all([monthlyMutations(month), monthlyHppTrend(6)]);

  return (
    <div className="space-y-6">
      {trend.length > 0 && (
        <Card>
          <div className="border-b border-slate-800 px-4 py-3">
            <h2 className="text-sm font-semibold text-slate-100">Trend HPP — 6 bulan terakhir</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-800/50 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                  <th className="px-4 py-2.5">Bulan</th>
                  <th className="px-4 py-2.5 text-right">Pembelian</th>
                  <th className="px-4 py-2.5 text-right">HPP keluar</th>
                  <th className="px-4 py-2.5 text-right">Nilai stok akhir</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {trend.map((r) => (
                  <tr
                    key={r.ym}
                    className={`transition-colors hover:bg-slate-800/50 ${r.ym === month ? "bg-indigo-500/5" : ""}`}
                  >
                    <td className="px-4 py-2.5 font-medium text-slate-200">{labelYm(r.ym)}</td>
                    <td className="px-4 py-2.5 text-right tabular text-slate-300">{formatIDR(r.pembelian)}</td>
                    <td className="px-4 py-2.5 text-right tabular text-slate-300">{formatIDR(r.hppKeluar)}</td>
                    <td className="px-4 py-2.5 text-right tabular text-slate-100">{formatIDR(r.nilaiStok)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
      <HppMutationTables groups={groups} />
    </div>
  );
}

async function ItemTab({ month }: { month: string }) {
  const rows = await itemHppSummary(month);
  const withActivity = rows.filter(
    (r) => Number(r.balQty) > 0 || r.hppKeluarBulan > 0 || r.pembelianBulan > 0,
  );

  if (withActivity.length === 0) {
    return (
      <Card className="px-6 py-16 text-center">
        <p className="text-sm text-slate-400">Tidak ada data item untuk {labelYm(month)}.</p>
      </Card>
    );
  }

  const totalNilai = withActivity.reduce((a, r) => a + Number(r.balValue), 0);
  const totalHpp = withActivity.reduce((a, r) => a + r.hppKeluarBulan, 0);

  return (
    <Card>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-800/50 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
              <th className="px-4 py-3">Barang</th>
              <th className="px-4 py-3">Kode</th>
              <th className="px-4 py-3 text-right">Sisa qty</th>
              <th className="px-4 py-3 text-right">HPP / Kg</th>
              <th className="px-4 py-3 text-right">Nilai stok</th>
              <th className="px-4 py-3 text-right">HPP keluar</th>
              <th className="px-4 py-3 text-right">Pembelian</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {withActivity.map((r) => (
              <tr key={r.id} className="transition-colors hover:bg-slate-800/50">
                <td className="px-4 py-3">
                  <Link
                    href={`/materials/${r.id}`}
                    className="font-medium text-indigo-300 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                  >
                    {r.brand}
                  </Link>
                </td>
                <td className="px-4 py-3 text-slate-300">{r.grade}</td>
                <td className="px-4 py-3 text-right tabular text-slate-100">{formatQty(r.balQty)}</td>
                <td className="px-4 py-3 text-right tabular text-slate-300">{formatIDR(r.avgCost)}</td>
                <td className="px-4 py-3 text-right tabular font-medium text-slate-100">
                  {formatIDR(r.balValue)}
                </td>
                <td className="px-4 py-3 text-right tabular text-slate-300">
                  {r.hppKeluarBulan > 0 ? formatIDR(r.hppKeluarBulan) : "—"}
                </td>
                <td className="px-4 py-3 text-right tabular text-slate-300">
                  {r.pembelianBulan > 0 ? formatIDR(r.pembelianBulan) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-slate-800 bg-slate-800/50 font-semibold text-slate-100">
              <td className="px-4 py-3" colSpan={4}>
                Total
              </td>
              <td className="px-4 py-3 text-right tabular">{formatIDR(totalNilai)}</td>
              <td className="px-4 py-3 text-right tabular">{formatIDR(totalHpp)}</td>
              <td className="px-4 py-3" />
            </tr>
          </tfoot>
        </table>
      </div>
    </Card>
  );
}
