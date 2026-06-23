import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { materials, transactions } from "@/db/schema";
import { listLedger } from "@/server/transactions";
import { LedgerTable } from "@/components/ledger-table";
import { PageHeader, PrimaryLink } from "@/components/ui";
import type { InferSelectModel } from "drizzle-orm";

export default async function LedgerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
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
  const rows: InferSelectModel<typeof transactions>[] = await listLedger(id);
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
      <LedgerTable rows={rows} />
    </div>
  );
}
