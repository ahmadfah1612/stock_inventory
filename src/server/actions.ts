"use server";
import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { addTransaction } from "@/server/transactions";
import { createMaterial } from "@/server/materials";
import { importBarangFromExcel, ImportError } from "@/server/import-excel";

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
  if (!brand || !grade) {
    redirect(`/materials?error=${encodeURIComponent("Brand and grade are required")}`);
  }
  try {
    await createMaterial({ brand, grade });
  } catch (e) {
    // 23505 = Postgres unique_violation (duplicate brand+grade)
    if ((e as { code?: string }).code === "23505") {
      redirect(`/materials?error=${encodeURIComponent(`${brand} ${grade} already exists`)}`);
    }
    throw e;
  }
  revalidatePath("/materials");
  redirect("/materials");
}

export async function importBarangAction(formData: FormData) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const brand = String(formData.get("brand") ?? "").trim();
  const grade = String(formData.get("grade") ?? "").trim();
  const file = formData.get("file");

  const back = (msg: string) => redirect(`/import?error=${encodeURIComponent(msg)}`);
  if (!brand || !grade) back("Barang dan Kode Barang wajib diisi.");
  if (!(file instanceof File) || file.size === 0) back("Pilih file Excel (.xlsx) untuk diimpor.");

  const f = file as File;
  if (!f.name.toLowerCase().endsWith(".xlsx")) back("File harus berformat .xlsx.");

  let materialId: string;
  try {
    const buf = await f.arrayBuffer();
    materialId = await importBarangFromExcel(buf, brand, grade, session.user.id);
  } catch (e) {
    if (e instanceof ImportError) back(e.message);
    throw e;
  }
  revalidatePath("/materials");
  revalidatePath("/");
  redirect(`/materials/${materialId}`);
}
