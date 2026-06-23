import { auth } from "@/lib/auth";
import { listMaterialsWithBalance } from "@/server/materials";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const rows = await listMaterialsWithBalance();
  const header = "Stock,Grade,Qty (Kg),Price/Kg,Total";
  const body = rows
    .map((r) =>
      [r.brand, r.grade, r.balQty, r.avgCost, r.balValue]
        .map((c) => `"${String(c).replace(/"/g, '""')}"`)
        .join(","),
    )
    .join("\n");

  return new Response(`${header}\n${body}\n`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="stock-summary.csv"`,
    },
  });
}
