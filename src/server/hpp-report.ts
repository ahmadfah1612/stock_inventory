import "server-only";
import { asc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { materials, transactions } from "@/db/schema";

export type MonthKpi = {
  totalHpp: number;
  pembelianMasuk: number;
  nilaiStokAkhir: number;
  jumlahItem: number;
};

export type MutationRow = {
  id: string;
  date: string;
  type: string;
  qty: string;
  avgCost: string;
  cogs: string;
  balQty: string;
};

export type MaterialMutations = {
  id: string;
  brand: string;
  grade: string;
  rows: MutationRow[];
};

export type ItemHppSummary = {
  id: string;
  brand: string;
  grade: string;
  balQty: string;
  avgCost: string;
  balValue: string;
  hppKeluarBulan: number;
  pembelianBulan: number;
};

export type MonthlyHppRow = {
  ym: string;
  pembelian: number;
  hppKeluar: number;
  nilaiStok: number;
};

/** Last calendar day of YYYY-MM as ISO date string. */
export function monthEnd(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  const last = new Date(y, m, 0).getDate();
  return `${ym}-${String(last).padStart(2, "0")}`;
}

export function currentYm(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function avgFromBalance(balQty: string, balValue: string): string {
  return Number(balQty) === 0 ? "0" : String(Number(balValue) / Number(balQty));
}

/** KPI cards for a selected month. */
export async function monthKpis(ym: string): Promise<MonthKpi> {
  const end = monthEnd(ym);

  const [flow, balances] = await Promise.all([
    db.execute(sql`
      select
        coalesce(sum(case when type = 'buy' then qty * unit_cost else 0 end), 0) as pembelian,
        coalesce(sum(case when type <> 'buy' then cogs else 0 end), 0) as hpp
      from transactions
      where to_char(date, 'YYYY-MM') = ${ym}
    `),
    db.execute(sql`
      select distinct on (material_id)
        material_id, bal_qty, bal_value
      from transactions
      where date <= ${end}::date
      order by material_id, date desc, seq desc
    `),
  ]);

  const flowRow = (flow as unknown as { rows: { pembelian: string; hpp: string }[] }).rows[0];
  const balRows = (balances as unknown as { rows: { bal_qty: string; bal_value: string }[] }).rows;

  const nilaiStokAkhir = balRows.reduce((a, r) => a + Number(r.bal_value), 0);
  const jumlahItem = balRows.filter((r) => Number(r.bal_qty) > 0).length;

  return {
    totalHpp: Number(flowRow?.hpp ?? 0),
    pembelianMasuk: Number(flowRow?.pembelian ?? 0),
    nilaiStokAkhir,
    jumlahItem,
  };
}

/** Per-material mutation rows for a month (Laporan HPP bulanan). */
export async function monthlyMutations(ym: string): Promise<MaterialMutations[]> {
  const mats = await db.select().from(materials).orderBy(asc(materials.brand), asc(materials.grade));
  const result: MaterialMutations[] = [];

  for (const m of mats) {
    const rows = await db
      .select()
      .from(transactions)
      .where(eq(transactions.materialId, m.id))
      .orderBy(asc(transactions.date), asc(transactions.seq));

    const inMonth = rows.filter((r) => r.date.startsWith(ym));
    if (inMonth.length === 0) continue;

    result.push({
      id: m.id,
      brand: m.brand,
      grade: m.grade,
      rows: inMonth.map((r) => ({
        id: r.id,
        date: r.date,
        type: r.type,
        qty: r.qty,
        avgCost: avgFromBalance(r.balQty, r.balValue),
        cogs: r.cogs,
        balQty: r.balQty,
      })),
    });
  }
  return result;
}

/** Full kartu stok (all transactions) per material. */
export async function allMutations(): Promise<MaterialMutations[]> {
  const mats = await db.select().from(materials).orderBy(asc(materials.brand), asc(materials.grade));
  const result: MaterialMutations[] = [];

  for (const m of mats) {
    const rows = await db
      .select()
      .from(transactions)
      .where(eq(transactions.materialId, m.id))
      .orderBy(asc(transactions.date), asc(transactions.seq));

    if (rows.length === 0) continue;

    result.push({
      id: m.id,
      brand: m.brand,
      grade: m.grade,
      rows: rows.map((r) => ({
        id: r.id,
        date: r.date,
        type: r.type,
        qty: r.qty,
        avgCost: avgFromBalance(r.balQty, r.balValue),
        cogs: r.cogs,
        balQty: r.balQty,
      })),
    });
  }
  return result;
}

/** HPP summary per item at month-end, with monthly flow stats. */
export async function itemHppSummary(ym: string): Promise<ItemHppSummary[]> {
  const end = monthEnd(ym);
  const mats = await db.select().from(materials).orderBy(asc(materials.brand), asc(materials.grade));
  const result: ItemHppSummary[] = [];

  for (const m of mats) {
    const rows = await db
      .select()
      .from(transactions)
      .where(eq(transactions.materialId, m.id))
      .orderBy(asc(transactions.date), asc(transactions.seq));

    const atEnd = [...rows].reverse().find((r) => r.date <= end);
    const inMonth = rows.filter((r) => r.date.startsWith(ym));

    const hppKeluarBulan = inMonth
      .filter((r) => r.type !== "buy")
      .reduce((a, r) => a + Number(r.cogs), 0);
    const pembelianBulan = inMonth
      .filter((r) => r.type === "buy")
      .reduce((a, r) => a + Number(r.qty) * Number(r.unitCost ?? 0), 0);

    const balQty = atEnd?.balQty ?? "0";
    const balValue = atEnd?.balValue ?? "0";

    result.push({
      id: m.id,
      brand: m.brand,
      grade: m.grade,
      balQty,
      avgCost: avgFromBalance(balQty, balValue),
      balValue,
      hppKeluarBulan,
      pembelianBulan,
    });
  }
  return result;
}

/** Monthly HPP trend for the last N months. */
export async function monthlyHppTrend(months = 12): Promise<MonthlyHppRow[]> {
  const res = await db.execute(sql`
    with months as (
      select
        to_char(date, 'YYYY-MM') as ym,
        coalesce(sum(case when type = 'buy' then qty * unit_cost else 0 end), 0) as pembelian,
        coalesce(sum(case when type <> 'buy' then cogs else 0 end), 0) as hpp_keluar
      from transactions
      group by 1
    )
    select ym, pembelian, hpp_keluar
    from months
    order by ym desc
    limit ${months}
  `);
  const rows = (res as unknown as { rows: { ym: string; pembelian: string; hpp_keluar: string }[] }).rows;

  const trend: MonthlyHppRow[] = [];
  for (const r of rows.reverse()) {
    const end = monthEnd(r.ym);
    const bal = await db.execute(sql`
      select coalesce(sum(bal_value::numeric), 0) as v
      from (
        select distinct on (material_id) bal_value
        from transactions
        where date <= ${end}::date
        order by material_id, date desc, seq desc
      ) s
    `);
    const nilaiStok = Number(
      (bal as unknown as { rows: { v: string }[] }).rows[0]?.v ?? 0,
    );
    trend.push({
      ym: r.ym,
      pembelian: Number(r.pembelian),
      hppKeluar: Number(r.hpp_keluar),
      nilaiStok,
    });
  }
  return trend;
}

/** Distinct months that have transactions (for month picker). */
export async function availableMonths(): Promise<string[]> {
  const res = await db.execute(sql`
    select distinct to_char(date, 'YYYY-MM') as ym
    from transactions
    order by ym desc
  `);
  const rows = (res as unknown as { rows: { ym: string }[] }).rows.map((r) => r.ym);
  const cur = currentYm();
  if (!rows.includes(cur)) rows.unshift(cur);
  return rows;
}
