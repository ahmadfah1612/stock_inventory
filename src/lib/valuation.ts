import Decimal from "decimal.js";

export type TxnType = "buy" | "sell" | "sample" | "scrap";

export interface TxnInput {
  type: TxnType;
  qty: string;
  unitCost?: string;
  salePrice?: string;
}

export interface TxnResult {
  cogs: string;
  revenue: string;
  profit: string;
  balQty: string;
  balValue: string;
  avgCost: string;
}

const s = (d: Decimal) => {
  const fixed = d.toFixed();
  return fixed.includes(".")
    ? fixed.replace(/0+$/, "").replace(/\.$/, "") || "0"
    : fixed;
};

export function computeLedger(txns: TxnInput[]): TxnResult[] {
  let qty = new Decimal(0);
  let value = new Decimal(0);
  const out: TxnResult[] = [];

  for (const t of txns) {
    const q = new Decimal(t.qty);
    if (t.type === "buy") {
      const cost = new Decimal(t.unitCost ?? "0");
      qty = qty.plus(q);
      value = value.plus(q.times(cost));
      out.push(snap(qty, value, "0", "0", "0"));
    } else {
      if (q.greaterThan(qty)) {
        throw new Error(
          `Insufficient stock: tried to remove ${s(q)} but only ${s(qty)} on hand`,
        );
      }
      const avg = qty.isZero() ? new Decimal(0) : value.div(qty);
      const cogs = q.times(avg);
      qty = qty.minus(q);
      value = value.minus(cogs);
      const revenue =
        t.type === "sell" && t.salePrice != null
          ? q.times(new Decimal(t.salePrice))
          : new Decimal(0);
      const profit = revenue.minus(cogs);
      out.push(snap(qty, value, s(cogs), s(revenue), s(profit)));
    }
  }
  return out;
}

function snap(
  qty: Decimal,
  value: Decimal,
  cogs: string,
  revenue: string,
  profit: string,
): TxnResult {
  const avg = qty.isZero() ? new Decimal(0) : value.div(qty);
  return {
    cogs,
    revenue,
    profit,
    balQty: s(qty),
    balValue: s(value),
    avgCost: s(avg),
  };
}
