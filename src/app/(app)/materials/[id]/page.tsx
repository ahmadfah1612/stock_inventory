import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { materials } from "@/db/schema";
import { listLedger } from "@/server/transactions";
import { LedgerTable } from "@/components/ledger-table";

export default async function LedgerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [mat] = await db.select().from(materials).where(eq(materials.id, id));
  if (!mat) return <div>Material not found.</div>;
  const rows = await listLedger(id);
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">{mat.brand} {mat.grade}</h1>
        <Link href={`/materials/${id}/new`} className="rounded bg-black px-3 py-1.5 text-sm text-white">+ Transaksi</Link>
      </div>
      <LedgerTable rows={rows as any} />
    </div>
  );
}
