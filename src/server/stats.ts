import "server-only";
import { sql } from "drizzle-orm";
import { db } from "@/db";

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
