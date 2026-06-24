import ExcelJS from "exceljs";
import { asc, inArray } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { materials, transactions } from "@/db/schema";

const MONEY = "#,##0";
const QTY = "#,##0.##";

function sheetName(base: string, used: Set<string>): string {
  let name = base.replace(/[[\]:*?/\\]/g, " ").trim().slice(0, 28) || "Sheet";
  let candidate = name;
  let n = 2;
  while (used.has(candidate.toLowerCase())) candidate = `${name.slice(0, 25)} ${n++}`;
  used.add(candidate.toLowerCase());
  return candidate;
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return new Response("Unauthorized", { status: 401 });

  const form = await req.formData();
  const ids = form.getAll("id").map(String).filter(Boolean);
  if (ids.length === 0) return new Response("No barang selected", { status: 400 });

  const mats = await db
    .select()
    .from(materials)
    .where(inArray(materials.id, ids))
    .orderBy(asc(materials.brand), asc(materials.grade));

  const wb = new ExcelJS.Workbook();
  wb.creator = "Stock PP";
  wb.created = new Date();
  const used = new Set<string>();

  // --- Ringkasan sheet ---
  const sum = wb.addWorksheet("Ringkasan");
  used.add("ringkasan");
  sum.columns = [
    { header: "Barang", key: "brand", width: 18 },
    { header: "Kode Barang", key: "grade", width: 18 },
    { header: "Qty (Kg)", key: "qty", width: 14, style: { numFmt: QTY } },
    { header: "Harga/Kg", key: "price", width: 16, style: { numFmt: MONEY } },
    { header: "Total", key: "total", width: 18, style: { numFmt: MONEY } },
  ];
  sum.getRow(1).font = { bold: true };

  for (const m of mats) {
    const rows = await db
      .select()
      .from(transactions)
      .where(inArray(transactions.materialId, [m.id]))
      .orderBy(asc(transactions.date), asc(transactions.seq));

    const last = rows.at(-1);
    const balQty = Number(last?.balQty ?? 0);
    const balValue = Number(last?.balValue ?? 0);
    sum.addRow({
      brand: m.brand,
      grade: m.grade,
      qty: balQty,
      price: balQty > 0 ? balValue / balQty : 0,
      total: balValue,
    });

    // --- per-barang stock card sheet ---
    const ws = wb.addWorksheet(sheetName(`${m.brand} ${m.grade}`, used));
    ws.mergeCells("A1:A2");
    ws.mergeCells("B1:B2");
    ws.mergeCells("C1:C2");
    ws.mergeCells("D1:D2");
    ws.mergeCells("E1:G1");
    ws.mergeCells("H1:J1");
    ws.mergeCells("K1:M1");
    ws.getCell("A1").value = "Tanggal";
    ws.getCell("B1").value = "No SJ/Invoice";
    ws.getCell("C1").value = "Tipe";
    ws.getCell("D1").value = "Customer";
    ws.getCell("E1").value = "Pembelian";
    ws.getCell("H1").value = "Penjualan";
    ws.getCell("K1").value = "Saldo";
    const sub = ["E2", "F2", "G2", "H2", "I2", "J2", "K2", "L2", "M2"];
    ["Unit", "Harga", "Jumlah", "Unit", "Harga", "Jumlah", "Unit", "Harga", "Jumlah"].forEach(
      (h, i) => (ws.getCell(sub[i]).value = h),
    );
    ws.getRow(1).font = { bold: true };
    ws.getRow(2).font = { bold: true };
    for (let c = 1; c <= 13; c++) {
      ws.getRow(1).getCell(c).alignment = { horizontal: "center", vertical: "middle" };
      ws.getRow(2).getCell(c).alignment = { horizontal: "center" };
    }
    ws.columns.forEach((col, i) => (col.width = i < 4 ? (i === 3 ? 26 : 14) : 15));

    for (const r of rows) {
      const isBuy = r.type === "buy";
      const qty = Number(r.qty);
      const unitCost = Number(r.unitCost ?? 0);
      const cogs = Number(r.cogs);
      const revenue = Number(r.revenue);
      const balQ = Number(r.balQty);
      const balV = Number(r.balValue);
      const row = ws.addRow([
        new Date(`${r.date}T00:00:00`),
        r.docNo ?? "",
        r.type,
        r.counterparty ?? "",
        isBuy ? qty : null,
        isBuy ? unitCost : null,
        isBuy ? qty * unitCost : null,
        !isBuy ? qty : null,
        !isBuy ? (r.salePrice != null ? Number(r.salePrice) : qty > 0 ? cogs / qty : 0) : null,
        !isBuy ? (revenue !== 0 ? revenue : cogs) : null,
        balQ,
        balQ > 0 ? balV / balQ : 0,
        balV,
      ]);
      row.getCell(1).numFmt = "dd/mm/yyyy";
      [5, 11].forEach((c) => (row.getCell(c).numFmt = QTY));
      [6, 7, 8, 9, 10, 12, 13].forEach((c) => (row.getCell(c).numFmt = MONEY));
      row.getCell(3).value = r.type.charAt(0).toUpperCase() + r.type.slice(1);
    }
    ws.views = [{ state: "frozen", ySplit: 2 }];
  }

  const buffer = await wb.xlsx.writeBuffer();
  const today = new Date().toISOString().slice(0, 10);
  return new Response(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="stock-export-${today}.xlsx"`,
    },
  });
}
