import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { transactions, materials } from "@/db/schema";

const NO_NAME = "(Tanpa nama)";

export type ProductLine = { name: string; qty: number; value: number };

export type CustomerRow = {
  name: string;
  txns: number;
  qty: number;
  revenue: number;
  cogs: number;
  profit: number;
  margin: number; // %
  last: string;
  products: ProductLine[];
};

export type SupplierRow = {
  name: string;
  txns: number;
  qty: number;
  totalBuy: number;
  avgPrice: number;
  last: string;
  products: ProductLine[];
};

export type CustomerReport = {
  rows: CustomerRow[];
  kpi: { customers: number; revenue: number; profit: number; margin: number };
};

export type SupplierReport = {
  rows: SupplierRow[];
  kpi: { suppliers: number; qty: number; totalBuy: number; avgPrice: number };
};

async function loadJoined() {
  return db
    .select({
      type: transactions.type,
      date: transactions.date,
      qty: transactions.qty,
      unitCost: transactions.unitCost,
      revenue: transactions.revenue,
      cogs: transactions.cogs,
      profit: transactions.profit,
      counterparty: transactions.counterparty,
      brand: materials.brand,
      grade: materials.grade,
    })
    .from(transactions)
    .innerJoin(materials, eq(transactions.materialId, materials.id));
}

export async function customerReport(): Promise<CustomerReport> {
  const all = await loadJoined();
  const sells = all.filter((r) => r.type === "sell");

  const map = new Map<string, CustomerRow>();
  const prod = new Map<string, Map<string, ProductLine>>();

  for (const r of sells) {
    const name = r.counterparty?.trim() || NO_NAME;
    const row =
      map.get(name) ??
      { name, txns: 0, qty: 0, revenue: 0, cogs: 0, profit: 0, margin: 0, last: "", products: [] };
    row.txns += 1;
    row.qty += Number(r.qty);
    row.revenue += Number(r.revenue);
    row.cogs += Number(r.cogs);
    row.profit += Number(r.profit);
    if (r.date > row.last) row.last = r.date;
    map.set(name, row);

    const pname = `${r.brand} ${r.grade}`;
    const pm = prod.get(name) ?? new Map<string, ProductLine>();
    const p = pm.get(pname) ?? { name: pname, qty: 0, value: 0 };
    p.qty += Number(r.qty);
    p.value += Number(r.revenue);
    pm.set(pname, p);
    prod.set(name, pm);
  }

  const rows = [...map.values()].map((row) => {
    row.margin = row.revenue > 0 ? (row.profit / row.revenue) * 100 : 0;
    row.products = [...(prod.get(row.name)?.values() ?? [])].sort((a, b) => b.value - a.value);
    return row;
  });

  const revenue = rows.reduce((a, r) => a + r.revenue, 0);
  const profit = rows.reduce((a, r) => a + r.profit, 0);
  return {
    rows,
    kpi: {
      customers: rows.length,
      revenue,
      profit,
      margin: revenue > 0 ? (profit / revenue) * 100 : 0,
    },
  };
}

export async function supplierReport(): Promise<SupplierReport> {
  const all = await loadJoined();
  const buys = all.filter((r) => r.type === "buy");

  const map = new Map<string, SupplierRow>();
  const prod = new Map<string, Map<string, ProductLine>>();

  for (const r of buys) {
    const name = r.counterparty?.trim() || NO_NAME;
    const qty = Number(r.qty);
    const buyVal = qty * Number(r.unitCost ?? 0);
    const row =
      map.get(name) ??
      { name, txns: 0, qty: 0, totalBuy: 0, avgPrice: 0, last: "", products: [] };
    row.txns += 1;
    row.qty += qty;
    row.totalBuy += buyVal;
    if (r.date > row.last) row.last = r.date;
    map.set(name, row);

    const pname = `${r.brand} ${r.grade}`;
    const pm = prod.get(name) ?? new Map<string, ProductLine>();
    const p = pm.get(pname) ?? { name: pname, qty: 0, value: 0 };
    p.qty += qty;
    p.value += buyVal;
    pm.set(pname, p);
    prod.set(name, pm);
  }

  const rows = [...map.values()].map((row) => {
    row.avgPrice = row.qty > 0 ? row.totalBuy / row.qty : 0;
    row.products = [...(prod.get(row.name)?.values() ?? [])].sort((a, b) => b.value - a.value);
    return row;
  });

  const qty = rows.reduce((a, r) => a + r.qty, 0);
  const totalBuy = rows.reduce((a, r) => a + r.totalBuy, 0);
  return {
    rows,
    kpi: {
      suppliers: rows.length,
      qty,
      totalBuy,
      avgPrice: qty > 0 ? totalBuy / qty : 0,
    },
  };
}
