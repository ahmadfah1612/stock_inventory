import "server-only";
import { asc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { materials, transactions } from "@/db/schema";
import { currentYm, monthEnd, toDateStr, toYm } from "@/lib/month";

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

type RawTxn = {
  id: string;
  materialId: string;
  brand: string;
  grade: string;
  date: string;
  type: string;
  qty: string;
  unitCost: string | null;
  cogs: string;
  balQty: string;
  balValue: string;
};

export { currentYm, monthEnd };

function avgFromBalance(balQty: string, balValue: string): string {
  return Number(balQty) === 0 ? "0" : String(Number(balValue) / Number(balQty));
}

function toMutationRow(r: RawTxn): MutationRow {
  return {
    id: r.id,
    date: r.date,
    type: r.type,
    qty: r.qty,
    avgCost: avgFromBalance(r.balQty, r.balValue),
    cogs: r.cogs,
    balQty: r.balQty,
  };
}

function normalizeTxn(
  r: Omit<RawTxn, "date"> & { date: string | Date },
): RawTxn {
  return { ...r, date: toDateStr(r.date) };
}

/** Single query: all transactions grouped by material (avoids N+1). */
async function loadGroupedTxns(): Promise<Map<string, { brand: string; grade: string; rows: RawTxn[] }>> {
  const rows = await db
    .select({
      id: transactions.id,
      materialId: transactions.materialId,
      brand: materials.brand,
      grade: materials.grade,
      date: transactions.date,
      type: transactions.type,
      qty: transactions.qty,
      unitCost: transactions.unitCost,
      cogs: transactions.cogs,
      balQty: transactions.balQty,
      balValue: transactions.balValue,
    })
    .from(transactions)
    .innerJoin(materials, eq(materials.id, transactions.materialId))
    .orderBy(asc(materials.brand), asc(materials.grade), asc(transactions.date), asc(transactions.seq));

  const map = new Map<string, { brand: string; grade: string; rows: RawTxn[] }>();
  for (const row of rows) {
    const r = normalizeTxn(row);
    let g = map.get(r.materialId);
    if (!g) {
      g = { brand: r.brand, grade: r.grade, rows: [] };
      map.set(r.materialId, g);
    }
    g.rows.push(r);
  }
  return map;
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
  const grouped = await loadGroupedTxns();
  const result: MaterialMutations[] = [];

  for (const [id, g] of grouped) {
    const inMonth = g.rows.filter((r) => toYm(r.date) === ym);
    if (inMonth.length === 0) continue;
    result.push({
      id,
      brand: g.brand,
      grade: g.grade,
      rows: inMonth.map(toMutationRow),
    });
  }
  return result;
}

/** Full kartu stok (all transactions) per material. */
export async function allMutations(): Promise<MaterialMutations[]> {
  const grouped = await loadGroupedTxns();
  const result: MaterialMutations[] = [];

  for (const [id, g] of grouped) {
    if (g.rows.length === 0) continue;
    result.push({
      id,
      brand: g.brand,
      grade: g.grade,
      rows: g.rows.map(toMutationRow),
    });
  }
  return result;
}

/** HPP summary per item at month-end, with monthly flow stats. */
export async function itemHppSummary(ym: string): Promise<ItemHppSummary[]> {
  const end = monthEnd(ym);
  const grouped = await loadGroupedTxns();
  const result: ItemHppSummary[] = [];

  for (const [id, g] of grouped) {
    const atEnd = [...g.rows].reverse().find((r) => r.date <= end);
    const inMonth = g.rows.filter((r) => toYm(r.date) === ym);

    const hppKeluarBulan = inMonth
      .filter((r) => r.type !== "buy")
      .reduce((a, r) => a + Number(r.cogs), 0);
    const pembelianBulan = inMonth
      .filter((r) => r.type === "buy")
      .reduce((a, r) => a + Number(r.qty) * Number(r.unitCost ?? 0), 0);

    const balQty = atEnd?.balQty ?? "0";
    const balValue = atEnd?.balValue ?? "0";

    result.push({
      id,
      brand: g.brand,
      grade: g.grade,
      balQty,
      avgCost: avgFromBalance(balQty, balValue),
      balValue,
      hppKeluarBulan,
      pembelianBulan,
    });
  }

  const mats = await db.select().from(materials).orderBy(asc(materials.brand), asc(materials.grade));
  for (const m of mats) {
    if (!grouped.has(m.id)) {
      result.push({
        id: m.id,
        brand: m.brand,
        grade: m.grade,
        balQty: "0",
        avgCost: "0",
        balValue: "0",
        hppKeluarBulan: 0,
        pembelianBulan: 0,
      });
    }
  }

  return result.sort((a, b) => a.brand.localeCompare(b.brand) || a.grade.localeCompare(b.grade));
}

/** Monthly HPP trend — uses the same GROUP BY pattern as stats.monthlyActivity. */
export async function monthlyHppTrend(months = 12): Promise<MonthlyHppRow[]> {
  const res = await db.execute(sql`
    select
      to_char(date, 'YYYY-MM') as ym,
      coalesce(sum(case when type = 'buy' then qty * unit_cost else 0 end), 0) as pembelian,
      coalesce(sum(case when type <> 'buy' then cogs else 0 end), 0) as hpp_keluar
    from transactions
    group by 1
    order by 1 desc
    limit ${months}
  `);

  const rows = (res as unknown as {
    rows: { ym: string; pembelian: string; hpp_keluar: string }[];
  }).rows;

  const ordered = [...rows].reverse();
  const trend: MonthlyHppRow[] = [];

  for (const r of ordered) {
    const { nilaiStokAkhir } = await monthKpis(r.ym);
    trend.push({
      ym: r.ym,
      pembelian: Number(r.pembelian),
      hppKeluar: Number(r.hpp_keluar),
      nilaiStok: nilaiStokAkhir,
    });
  }

  return trend;
}

/** Distinct months that have transactions (for month picker). */
export async function availableMonths(): Promise<string[]> {
  const res = await db.execute(sql`
    select to_char(date, 'YYYY-MM') as ym
    from transactions
    group by 1
    order by 1 desc
  `);
  const rows = (res as unknown as { rows: { ym: string }[] }).rows.map((r) => r.ym);
  const cur = currentYm();
  if (!rows.includes(cur)) rows.unshift(cur);
  return rows;
}
