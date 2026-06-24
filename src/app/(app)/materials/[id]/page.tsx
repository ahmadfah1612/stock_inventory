import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { materials, transactions } from "@/db/schema";
import { listLedger } from "@/server/transactions";
import { LedgerTable } from "@/components/ledger-table";
import { PageHeader, PrimaryLink } from "@/components/ui";
import { AveragePanel, type Saldo } from "@/components/average-panel";
import type { InferSelectModel } from "drizzle-orm";

type Txn = InferSelectModel<typeof transactions>;

/** Saldo (running balance) at the last transaction within the range. Harga = weighted-avg cost. */
function saldoAtEnd(rows: Txn[]): Saldo | null {
  if (rows.length === 0) return null;
  const last = rows[rows.length - 1];
  const unit = Number(last.balQty);
  const jumlah = Number(last.balValue);
  return { unit, jumlah, harga: unit > 0 ? jumlah / unit : 0, asOf: last.date };
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
      <AveragePanel action={`/materials/${id}`} from={from} to={to} saldo={saldoAtEnd(inRange)} />
      <LedgerTable rows={rows} />
    </div>
  );
}
