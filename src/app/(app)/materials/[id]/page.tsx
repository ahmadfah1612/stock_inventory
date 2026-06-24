import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { materials, transactions } from "@/db/schema";
import { listLedger } from "@/server/transactions";
import { auth } from "@/lib/auth";
import { LedgerTable } from "@/components/ledger-table";
import { PageHeader, PrimaryLink, StatCard } from "@/components/ui";
import { formatIDR, formatQty } from "@/lib/money";
import { AveragePanel, type Saldo } from "@/components/average-panel";
import { DeleteBarangButton } from "@/components/delete-barang-button";
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
      <div className="rounded-xl border border-slate-800 bg-slate-900 px-6 py-16 text-center shadow-sm">
        <p className="text-sm font-medium text-slate-100">Material not found</p>
        <Link href="/materials" className="mt-3 inline-flex text-sm font-medium text-indigo-300 hover:underline">
          Back to Materials
        </Link>
      </div>
    );
  }
  const [rows, session] = await Promise.all([listLedger(id), auth()]);
  const isAdmin = session?.user?.role === "admin";
  const inRange = rows.filter((r) => (!from || r.date >= from) && (!to || r.date <= to));
  const latest = rows.at(-1);
  const latestQty = latest ? Number(latest.balQty) : 0;
  const latestValue = latest ? Number(latest.balValue) : 0;
  const latestHpp = latestQty > 0 ? latestValue / latestQty : 0;
  return (
    <div>
      <div className="mb-4">
        <Link
          href="/materials"
          className="text-sm font-medium text-slate-400 hover:text-slate-200"
        >
          ← Materials
        </Link>
      </div>
      <PageHeader
        title={`${mat.brand} ${mat.grade}`}
        subtitle="Stock card · running weighted-average cost"
        action={
          <div className="flex items-center gap-2">
            <PrimaryLink href={`/materials/${id}/new`}>+ Transaksi</PrimaryLink>
            {isAdmin && <DeleteBarangButton id={id} label={`${mat.brand} ${mat.grade}`} />}
          </div>
        }
      />
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Stok Tersedia"
          value={formatQty(latestQty)}
          hint={latest ? `per ${latest.date}` : "belum ada transaksi"}
        />
        <StatCard label="Total Nilai Barang" value={formatIDR(latestValue)} hint="qty × HPP" />
        <StatCard label="HPP / Kg" value={formatIDR(latestHpp)} hint="rata-rata bergerak" />
      </div>

      <AveragePanel
        action={`/materials/${id}`}
        from={from}
        to={to}
        saldo={from || to ? saldoAtEnd(inRange) : null}
      />
      <LedgerTable rows={rows} />
    </div>
  );
}
