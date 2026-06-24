import "server-only";
import { asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { materials, transactions } from "@/db/schema";

export interface MaterialSummary {
  id: string; brand: string; grade: string;
  balQty: string; avgCost: string; balValue: string;
}

export async function listMaterialsWithBalance(): Promise<MaterialSummary[]> {
  const mats = await db.select().from(materials).orderBy(asc(materials.brand), asc(materials.grade));
  const result: MaterialSummary[] = [];
  for (const m of mats) {
    const [last] = await db
      .select()
      .from(transactions)
      .where(eq(transactions.materialId, m.id))
      .orderBy(desc(transactions.date), desc(transactions.seq))
      .limit(1);
    const balQty = last?.balQty ?? "0";
    const balValue = last?.balValue ?? "0";
    const avgCost = Number(balQty) === 0 ? "0" : String(Number(balValue) / Number(balQty));
    result.push({ id: m.id, brand: m.brand, grade: m.grade, balQty, avgCost, balValue });
  }
  return result;
}

export async function createMaterial(input: { brand: string; grade: string }) {
  await db.insert(materials).values({ brand: input.brand.trim(), grade: input.grade.trim() });
}

export async function updateMaterial(id: string, input: { brand: string; grade: string }) {
  await db
    .update(materials)
    .set({ brand: input.brand.trim(), grade: input.grade.trim() })
    .where(eq(materials.id, id));
}

/** Deletes a material and its transactions (FK cascade). */
export async function deleteMaterial(id: string) {
  await db.delete(materials).where(eq(materials.id, id));
}
