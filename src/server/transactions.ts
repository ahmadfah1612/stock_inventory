import "server-only";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { transactions } from "@/db/schema";
import { computeLedger, type TxnInput } from "@/lib/valuation";

type Row = { type: string; qty: string; unitCost: string | null; salePrice: string | null };

export function toLedgerInputs(rows: readonly Row[]): TxnInput[] {
  return rows.map((r) => ({
    type: r.type as TxnInput["type"],
    qty: r.qty,
    unitCost: r.unitCost ?? undefined,
    salePrice: r.salePrice ?? undefined,
  }));
}

export interface AddTxnInput {
  materialId: string;
  date: string;
  type: TxnInput["type"];
  qty: string;
  unitCost?: string;
  salePrice?: string;
  docNo?: string;
  counterparty?: string;
  note?: string;
  createdBy?: string;
}

export async function listLedger(materialId: string) {
  return db.select().from(transactions)
    .where(eq(transactions.materialId, materialId))
    .orderBy(asc(transactions.date), asc(transactions.seq));
}

export async function applyLedger(materialId: string) {
  const rows = await listLedger(materialId);
  const results = computeLedger(toLedgerInputs(rows));
  for (let i = 0; i < rows.length; i++) {
    const r = results[i];
    await db.update(transactions).set({
      cogs: r.cogs, revenue: r.revenue, profit: r.profit,
      balQty: r.balQty, balValue: r.balValue,
    }).where(eq(transactions.id, rows[i].id));
  }
}

export async function addTransaction(input: AddTxnInput) {
  await db.transaction(async (tx) => {
    await tx.insert(transactions).values({
      materialId: input.materialId, date: input.date, type: input.type, qty: input.qty,
      unitCost: input.unitCost ?? null, salePrice: input.salePrice ?? null,
      docNo: input.docNo ?? null, counterparty: input.counterparty ?? null,
      note: input.note ?? null, createdBy: input.createdBy ?? null,
    });
    const rows = await tx.select().from(transactions)
      .where(eq(transactions.materialId, input.materialId))
      .orderBy(asc(transactions.date), asc(transactions.seq));
    const results = computeLedger(toLedgerInputs(rows)); // throws → tx rolls back
    for (let i = 0; i < rows.length; i++) {
      const r = results[i];
      await tx.update(transactions).set({
        cogs: r.cogs, revenue: r.revenue, profit: r.profit,
        balQty: r.balQty, balValue: r.balValue,
      }).where(eq(transactions.id, rows[i].id));
    }
  });
}
