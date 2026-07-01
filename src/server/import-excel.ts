import "server-only";
import ExcelJS from "exceljs";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { materials, transactions } from "@/db/schema";
import { computeLedger, type TxnInput } from "@/lib/valuation";

/** Thrown for any user-facing import problem (bad format, duplicate, inconsistent data). */
export class ImportError extends Error {}

const FORMAT_MSG =
  "Format Excel tidak sesuai. Gunakan template: baris 1 = Tanggal, No SJ, Buy/Sell/Sample, Customer, Pembelian, Penjualan, Saldo; baris 2 = Unit, Harga, Jumlah (×3); data mulai baris 3.";

type CellVal = ExcelJS.CellValue;
const text = (v: CellVal): string => {
  if (v == null) return "";
  if (typeof v === "object") {
    if ("text" in v && typeof v.text === "string") return v.text;
    if ("result" in v) return String((v as { result: unknown }).result ?? "");
    if ("richText" in v) return (v as { richText: { text: string }[] }).richText.map((t) => t.text).join("");
  }
  return String(v);
};
const num = (v: CellVal): number | null => {
  if (v == null || v === "") return null;
  const s = text(v).replace(/,/g, "").trim();
  if (s === "" || s === "-") return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
};
const asDate = (v: CellVal): string | null => {
  if (v instanceof Date) {
    if (v.getFullYear() < 2005 || v.getFullYear() > 2100) return null;
    return `${v.getFullYear()}-${String(v.getMonth() + 1).padStart(2, "0")}-${String(v.getDate()).padStart(2, "0")}`;
  }
  return null;
};

const TYPES: Record<string, TxnInput["type"]> = {
  buy: "buy",
  sell: "sell",
  sample: "sample",
  scrap: "scrap",
};

function validateHeader(ws: ExcelJS.Worksheet) {
  const cell = (addr: string) => text(ws.getCell(addr).value).toLowerCase().trim();
  const ok =
    cell("A1").includes("tanggal") &&
    (cell("C1").includes("buy") || cell("C1").includes("sell") || cell("C1").includes("sample")) &&
    cell("D1").includes("customer") &&
    cell("E1").includes("pembelian") &&
    cell("H1").includes("penjualan") &&
    cell("K1").includes("saldo") &&
    cell("E2").includes("unit") &&
    cell("H2").includes("unit") &&
    cell("K2").includes("unit");
  if (!ok) throw new ImportError(FORMAT_MSG);
}

type Raw = {
  date: string | null;
  type: TxnInput["type"];
  qty: string;
  unitCost?: string;
  docNo: string | null;
  counterparty: string | null;
};

function parseRows(ws: ExcelJS.Worksheet): { inputs: TxnInput[]; meta: Raw[] } {
  const raw: Raw[] = [];
  const last = ws.rowCount;
  for (let r = 3; r <= last; r++) {
    const row = ws.getRow(r);
    const cv = (col: number) => row.getCell(col).value;
    const pembUnit = num(cv(5));
    const penjUnit = num(cv(8));
    let t = TYPES[text(cv(3)).toLowerCase().trim()];
    if (!t) {
      if (pembUnit && pembUnit !== 0) t = "buy";
      else if (penjUnit && penjUnit !== 0) t = "sell";
      else continue; // blank / Average / total row
    }
    const qtyN = t === "buy" ? (pembUnit ?? penjUnit) : (penjUnit ?? pembUnit);
    if (qtyN == null || qtyN === 0) continue;
    const unit = t === "buy" ? num(cv(6)) ?? num(cv(9)) : null;
    raw.push({
      date: asDate(cv(1)),
      type: t,
      qty: String(qtyN),
      unitCost: t === "buy" && unit != null ? String(unit) : undefined,
      docNo: text(cv(2)).trim() || null,
      counterparty: text(cv(4)).trim() || null,
    });
  }
  if (raw.length === 0) throw new ImportError("File tidak berisi transaksi yang valid.");

  // forward/back-fill dates, then clamp non-decreasing to preserve sheet order
  const firstKnown = raw.find((x) => x.date)?.date ?? null;
  let lastDate = firstKnown;
  for (const x of raw) {
    x.date = x.date ?? lastDate;
    lastDate = x.date;
  }
  if (raw.some((x) => !x.date)) throw new ImportError("Ada baris tanpa tanggal yang valid.");
  let mx: string | null = null;
  for (const x of raw) {
    if (mx && x.date! < mx) x.date = mx;
    else mx = x.date!;
  }

  const inputs: TxnInput[] = raw.map((x) => ({ type: x.type, qty: x.qty, unitCost: x.unitCost }));
  return { inputs, meta: raw };
}

export async function importBarangFromExcel(
  buffer: ArrayBuffer,
  brand: string,
  grade: string,
  createdBy: string,
): Promise<string> {
  brand = brand.trim();
  grade = grade.trim();
  if (!brand || !grade) throw new ImportError("Barang dan Kode Barang wajib diisi.");

  const wb = new ExcelJS.Workbook();
  try {
    await wb.xlsx.load(buffer);
  } catch {
    throw new ImportError("File tidak bisa dibaca. Pastikan file Excel (.xlsx) yang valid.");
  }
  const ws = wb.worksheets[0];
  if (!ws) throw new ImportError(FORMAT_MSG);
  validateHeader(ws);

  const { inputs, meta } = parseRows(ws);

  // validate ledger math (oversell) before writing anything
  let results;
  try {
    results = computeLedger(inputs);
  } catch (e) {
    throw new ImportError(`Data tidak konsisten: ${(e as Error).message}`);
  }

  const dup = await db
    .select({ id: materials.id })
    .from(materials)
    .where(and(eq(materials.brand, brand), eq(materials.grade, grade)));
  if (dup.length) throw new ImportError(`${brand} ${grade} sudah ada. Hapus dulu atau pakai nama lain.`);

  const materialId = await db.transaction(async (tx) => {
    const [mat] = await tx.insert(materials).values({ brand, grade }).returning();
    for (let i = 0; i < inputs.length; i++) {
      await tx.insert(transactions).values({
        materialId: mat.id,
        date: meta[i].date!,
        type: inputs[i].type,
        qty: inputs[i].qty,
        unitCost: inputs[i].unitCost ?? null,
        docNo: meta[i].docNo,
        counterparty: meta[i].counterparty,
        createdBy,
      });
    }
    const rows = await tx
      .select()
      .from(transactions)
      .where(eq(transactions.materialId, mat.id))
      .orderBy(asc(transactions.date), asc(transactions.seq));
    for (let i = 0; i < rows.length; i++) {
      const res = results[i];
      await tx
        .update(transactions)
        .set({
          cogs: res.cogs,
          revenue: res.revenue,
          profit: res.profit,
          balQty: res.balQty,
          balValue: res.balValue,
        })
        .where(eq(transactions.id, rows[i].id));
    }
    return mat.id;
  });
  return materialId;
}
