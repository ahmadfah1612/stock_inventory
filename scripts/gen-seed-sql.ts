// Generates a standalone seed.sql from scripts/.import-data.json.
// Computes the ledger locally (same as import-xlsx.ts) so no DB
// connection is needed to produce it. Output: scratchpad/seed.sql.
import { readFileSync, writeFileSync } from "node:fs";
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

const OUT = process.argv[3] ?? "/private/tmp/seed.sql";
const SRC = process.argv[2] ?? new URL("./.import-data.json", import.meta.url).pathname;

const data: Material[] = JSON.parse(readFileSync(SRC, "utf8"));

const q = (v: string | null) => (v == null ? "NULL" : `'${v.replace(/'/g, "''")}'`);

const lines: string[] = [];
lines.push("BEGIN;");
lines.push("DELETE FROM transactions;");
lines.push("DELETE FROM materials;");

const ok: string[] = [];
const failed: { name: string; reason: string }[] = [];

for (const m of data) {
  const label = `${m.brand} ${m.grade}`.trim();
  let results;
  try {
    results = computeLedger(
      m.txns.map((t) => ({
        type: t.type,
        qty: t.qty,
        unitCost: t.unitCost ?? undefined,
        salePrice: t.salePrice ?? undefined,
      })),
    );
  } catch (e) {
    failed.push({ name: label, reason: (e as Error).message });
    continue;
  }

  const rows = m.txns.map((t, i) => {
    const r = results[i];
    return `    (m.id, ${q(t.date)}::date, ${q(t.type)}::txn_type, ${q(t.docNo)}, ${q(t.counterparty)}, ${q(t.qty)}::numeric, ${t.unitCost == null ? "NULL" : `${q(t.unitCost)}::numeric`}, ${t.salePrice == null ? "NULL" : `${q(t.salePrice)}::numeric`}, ${q(r.cogs)}::numeric, ${q(r.revenue)}::numeric, ${q(r.profit)}::numeric, ${q(r.balQty)}::numeric, ${q(r.balValue)}::numeric)`;
  });

  lines.push(
    `WITH m AS (\n  INSERT INTO materials (brand, grade) VALUES (${q(m.brand)}, ${q(m.grade)}) RETURNING id\n)\nINSERT INTO transactions\n  (material_id, date, type, doc_no, counterparty, qty, unit_cost, sale_price, cogs, revenue, profit, bal_qty, bal_value)\nSELECT v.* FROM m,\n  (VALUES\n${rows.join(",\n")}\n  ) AS v(material_id, date, type, doc_no, counterparty, qty, unit_cost, sale_price, cogs, revenue, profit, bal_qty, bal_value);`,
  );
  ok.push(label);
}

lines.push("COMMIT;");
writeFileSync(OUT, lines.join("\n\n") + "\n");

console.log(`wrote ${OUT}`);
console.log(`materials OK: ${ok.length}`);
if (failed.length) {
  console.log(`skipped (${failed.length}):`);
  for (const f of failed) console.log(`  - ${f.name}: ${f.reason}`);
}
