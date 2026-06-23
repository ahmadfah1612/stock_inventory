"use server";
import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { addTransaction } from "@/server/transactions";
import { createMaterial } from "@/server/materials";

const schema = z.object({
  materialId: z.string().uuid(),
  date: z.string().min(1),
  type: z.enum(["buy", "sell", "sample", "scrap"]),
  qty: z.string().regex(/^\d+(\.\d+)?$/),
  unitCost: z.string().optional(),
  salePrice: z.string().optional(),
  docNo: z.string().optional(),
  counterparty: z.string().optional(),
  note: z.string().optional(),
});

export async function createTransactionAction(formData: FormData) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const parsed = schema.parse(Object.fromEntries(formData));
  if (parsed.type === "buy" && !parsed.unitCost) {
    throw new Error("Buy requires unit cost");
  }
  try {
    await addTransaction({ ...parsed, createdBy: session.user.id });
  } catch (e) {
    redirect(`/materials/${parsed.materialId}/new?error=${encodeURIComponent((e as Error).message)}`);
  }
  revalidatePath(`/materials/${parsed.materialId}`);
  revalidatePath("/");
  redirect(`/materials/${parsed.materialId}`);
}

export async function createMaterialAction(formData: FormData) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const brand = String(formData.get("brand") ?? "").trim();
  const grade = String(formData.get("grade") ?? "").trim();
  if (!brand || !grade) throw new Error("Brand and grade required");
  await createMaterial({ brand, grade });
  revalidatePath("/materials");
  redirect("/materials");
}
