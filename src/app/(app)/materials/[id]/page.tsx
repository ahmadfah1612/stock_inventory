import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { materials, transactions } from "@/db/schema";
import { listLedger } from "@/server/transactions";
import { LedgerTable } from "@/components/ledger-table";
import { PageHeader, PrimaryLink } from "@/components/ui";
import { AveragePanel, type SideAvg } from "@/components/average-panel";
import type { InferSelectModel } from "drizzle-orm";

type Txn = InferSelectModel<typeof transactions>;

const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

function avgBuy(rows: Txn[]): SideAvg {
  const buys = rows.filter((r) => r.type === "buy");
  return {
    count: buys.length,
    unit: mean(buys.map((r) => Number(r.qty))),
    harga: mean(buys.map((r) => Number(r.unitCost ?? 0))),
    jumlah: mean(buys.map((r) => Number(r.qty) * Number(r.unitCost ?? 0))),
  };
}

function avgSell(rows: Txn[]): SideAvg {
  const sells = rows.filter((r) => r.type !== "buy");
  return {
    count: sells.length,
    unit: mean(sells.map((r) => Number(r.qty))),
    // per-unit price: actual sale price if recorded, else weighted-average cost (cogs / qty)
    harga: mean(
      sells.map((r) =>
        r.salePrice != null
          ? Number(r.salePrice)
          : Number(r.qty) > 0
            ? Number(r.cogs) / Number(r.qty)
            : 0,
      ),
    ),
    jumlah: mean(sells.map((r) => (r.revenue !== "0" ? Number(r.revenue) : Number(r.cogs)))),
  };
}

export default async function LedgerPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const { id } = await params;
  const { from, to } = await searchParams;
  const [mat] = await db.select().from(materials).where(eq(materials.id, id));
  if (!mat) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
        <p className="text-sm font-medium text-slate-900">Material not found</p>
        <Link href="/materials" className="mt-3 inline-flex text-sm font-medium text-indigo-700 hover:underline">
          Back to Materials
        </Link>
      </div>
    );
  }
  const rows: Txn[] = await listLedger(id);
  const inRange = rows.filter((r) => (!from || r.date >= from) && (!to || r.date <= to));
  return (
    <div>
      <div className="mb-4">
        <Link
          href="/materials"
          className="text-sm font-medium text-slate-500 hover:text-slate-700"
        >
          ← Materials
        </Link>
      </div>
      <PageHeader
        title={`${mat.brand} ${mat.grade}`}
        subtitle="Stock card · running weighted-average cost"
        action={<PrimaryLink href={`/materials/${id}/new`}>+ Transaksi</PrimaryLink>}
      />
      <AveragePanel
        action={`/materials/${id}`}
        from={from}
        to={to}
        buy={avgBuy(inRange)}
        sell={avgSell(inRange)}
      />
      <LedgerTable rows={rows} />
    </div>
  );
}
