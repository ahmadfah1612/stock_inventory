import "server-only";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { materials, transactions } from "@/db/schema";

export type MonthStat = { ym: string; buy: number; sell: number };

/** Monthly Pembelian (buy value) and Penjualan (sell value) totals, last `months` months. */
export async function monthlyActivity(months = 12): Promise<MonthStat[]> {
  const res = await db.execute(sql`
    select
      to_char(date, 'YYYY-MM') as ym,
      coalesce(sum(case when type = 'buy' then qty * unit_cost else 0 end), 0) as buy,
      coalesce(sum(case when type <> 'buy'
        then (case when revenue <> '0' then revenue else cogs end) else 0 end), 0) as sell
    from transactions
    group by 1
    order by 1 desc
    limit ${months}
  `);
  const rows = (res as unknown as { rows: { ym: string; buy: string; sell: string }[] }).rows;
  return rows
    .map((r) => ({ ym: r.ym, buy: Number(r.buy), sell: Number(r.sell) }))
    .reverse();
}

export type RecentTxn = {
  id: string;
  date: string;
  materialId: string;
  brand: string;
  grade: string;
  type: string;
  qty: string;
};

/** Latest transactions across all barang. */
export async function recentTransactions(limit = 8): Promise<RecentTxn[]> {
  return db
    .select({
      id: transactions.id,
      date: transactions.date,
      materialId: materials.id,
      brand: materials.brand,
      grade: materials.grade,
      type: transactions.type,
      qty: transactions.qty,
    })
    .from(transactions)
    .innerJoin(materials, eq(materials.id, transactions.materialId))
    .orderBy(desc(transactions.date), desc(transactions.seq))
    .limit(limit);
}

/** Total cost value of goods that left as Sample or Scrap (free / written off). */
export async function leakageTotal(): Promise<number> {
  const res = await db.execute(sql`
    select coalesce(sum(cogs), 0) as v
    from transactions
    where type in ('sample', 'scrap')
  `);
  const rows = (res as unknown as { rows: { v: string }[] }).rows;
  return Number(rows[0]?.v ?? 0);
}
