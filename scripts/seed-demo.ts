import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { materials, transactions } from "@/db/schema";
import { computeLedger, type TxnInput } from "@/lib/valuation";

type Seed = {
  brand: string;
  grade: string;
  txns: {
    date: string;
    type: TxnInput["type"];
    qty: string;
    unitCost?: string;
    salePrice?: string;
    docNo?: string;
    counterparty?: string;
  }[];
};

const data: Seed[] = [
  {
    brand: "Exxon",
    grade: "AP03B",
    txns: [
      { date: "2025-07-01", type: "buy", qty: "25500", unitCost: "16089", docNo: "001.BPS.0625", counterparty: "PT.Inabata Indonesia" },
      { date: "2025-07-14", type: "buy", qty: "25500", unitCost: "15346", docNo: "002.BPS.0625", counterparty: "PT.Inabata Indonesia" },
      { date: "2025-08-05", type: "sell", qty: "19500", salePrice: "18200", docNo: "001.BPS.0825-13", counterparty: "PT.Galih Sekar Sakti" },
      { date: "2025-08-18", type: "sample", qty: "25", docNo: "-", counterparty: "PT.Mah Sing Indonesia" },
    ],
  },
  {
    brand: "Lotte",
    grade: "J740N",
    txns: [
      { date: "2025-06-11", type: "buy", qty: "25375", unitCost: "15854", docNo: "-", counterparty: "PT.Inabata Indonesia" },
      { date: "2025-07-04", type: "sell", qty: "25375", salePrice: "16900", docNo: "002.BPS.0623-18", counterparty: "PT.Bagus Indah Lestari" },
    ],
  },
  {
    brand: "Yuplene",
    grade: "R680S",
    txns: [
      { date: "2025-11-03", type: "buy", qty: "10000", unitCost: "18100", docNo: "004.BPS.1025", counterparty: "PT.Kristal Petrochemical" },
    ],
  },
];

async function main() {
  for (const s of data) {
    const [m] = await db
      .insert(materials)
      .values({ brand: s.brand, grade: s.grade })
      .returning();
    for (const t of s.txns) {
      await db.insert(transactions).values({
        materialId: m.id,
        date: t.date,
        type: t.type,
        qty: t.qty,
        unitCost: t.unitCost ?? null,
        salePrice: t.salePrice ?? null,
        docNo: t.docNo ?? null,
        counterparty: t.counterparty ?? null,
      });
    }
    // recompute snapshots (same logic as applyLedger)
    const rows = await db
      .select()
      .from(transactions)
      .where(eq(transactions.materialId, m.id))
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
      await db
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
    console.log(`seeded ${s.brand} ${s.grade}`);
  }
  process.exit(0);
}

main();
