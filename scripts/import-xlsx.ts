import { readFileSync } from "node:fs";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { materials, transactions } from "@/db/schema";
import { computeLedger, type TxnInput } from "@/lib/valuation";

type Txn = {
  date: string;
  type: TxnInput["type"];
  qty: string;
  unitCost: string | null;
  salePrice: string | null;
  docNo: string | null;
  counterparty: string | null;
};
type Material = { brand: string; grade: string; txns: Txn[] };

const JSON_PATH =
  process.argv[2] ?? new URL("./.import-data.json", import.meta.url).pathname;

async function main() {
  const data: Material[] = JSON.parse(readFileSync(JSON_PATH, "utf8"));

  // wipe existing (demo) data
  await db.delete(transactions);
  await db.delete(materials);

  const ok: string[] = [];
  const failed: { name: string; reason: string }[] = [];

  for (const m of data) {
    const label = `${m.brand} ${m.grade}`.trim();
    try {
      await db.transaction(async (tx) => {
        const [mat] = await tx
          .insert(materials)
          .values({ brand: m.brand, grade: m.grade })
          .returning();
        for (const t of m.txns) {
          await tx.insert(transactions).values({
            materialId: mat.id,
            date: t.date,
            type: t.type,
            qty: t.qty,
            unitCost: t.unitCost,
            salePrice: t.salePrice,
            docNo: t.docNo,
            counterparty: t.counterparty,
          });
        }
        const rows = await tx
          .select()
          .from(transactions)
          .where(eq(transactions.materialId, mat.id))
          .orderBy(asc(transactions.date), asc(transactions.seq));
        const results = computeLedger(
          rows.map((r) => ({
            type: r.type,
            qty: r.qty,
            unitCost: r.unitCost ?? undefined,
            salePrice: r.salePrice ?? undefined,
          })),
        );
        for (let i = 0; i < rows.length; i++) {
          const r = results[i];
          await tx
            .update(transactions)
            .set({
              cogs: r.cogs,
              revenue: r.revenue,
              profit: r.profit,
              balQty: r.balQty,
              balValue: r.balValue,
            })
            .where(eq(transactions.id, rows[i].id));
        }
      });
      ok.push(label);
    } catch (e) {
      failed.push({ name: label, reason: (e as Error).message });
    }
  }

  console.log(`imported OK: ${ok.length} grades`);
  if (failed.length) {
    console.log(`\nFAILED (${failed.length}) — skipped, likely Excel data inconsistency:`);
    for (const f of failed) console.log(`  - ${f.name}: ${f.reason}`);
  }
  process.exit(0);
}

main();
