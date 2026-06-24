"use server";
import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { addTransaction } from "@/server/transactions";
import { createMaterial, deleteMaterial, updateMaterial } from "@/server/materials";
import { importBarangFromExcel, ImportError } from "@/server/import-excel";
import { createUser, deleteUser, changePassword } from "@/server/users";
import { setSetting, LOW_STOCK_KEY } from "@/server/settings";
import type { Role } from "@/lib/auth";

async function requireAdmin(): Promise<{ id: string }> {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "admin") redirect("/");
  return { id: session.user.id };
}

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

export async function updateMaterialAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const brand = String(formData.get("brand") ?? "").trim();
  const grade = String(formData.get("grade") ?? "").trim();
  if (!id) redirect("/materials");
  const back = (m: string) => redirect(`/materials/${id}?error=${encodeURIComponent(m)}`);
  if (!brand || !grade) back("Barang dan Kode Barang wajib diisi.");
  try {
    await updateMaterial(id, { brand, grade });
  } catch (e) {
    if ((e as { code?: string }).code === "23505") back(`${brand} ${grade} sudah ada.`);
    throw e;
  }
  revalidatePath(`/materials/${id}`);
  revalidatePath("/materials");
  revalidatePath("/");
  redirect(`/materials/${id}?ok=${encodeURIComponent("Barang diperbarui.")}`);
}

export async function deleteMaterialAction(formData: FormData) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  // RBAC: only admin may delete barang
  if (session.user.role !== "admin") {
    redirect(`/materials?error=${encodeURIComponent("Hanya admin yang dapat menghapus barang.")}`);
  }
  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/materials");
  await deleteMaterial(id);
  revalidatePath("/materials");
  revalidatePath("/");
  redirect(`/materials?deleted=1`);
}

export async function createUserAction(formData: FormData) {
  await requireAdmin();
  const email = String(formData.get("email") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const role: Role = formData.get("role") === "admin" ? "admin" : "user";
  const back = (m: string) => redirect(`/users?error=${encodeURIComponent(m)}`);
  if (!email || !name || !password) back("Email, nama, dan password wajib diisi.");
  if (password.length < 6) back("Password minimal 6 karakter.");
  try {
    await createUser({ email, name, password, role });
  } catch (e) {
    if ((e as { code?: string }).code === "23505") back(`Email ${email} sudah terdaftar.`);
    throw e;
  }
  revalidatePath("/users");
  redirect("/users?ok=" + encodeURIComponent("User ditambahkan."));
}

export async function deleteUserAction(formData: FormData) {
  const admin = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/users");
  if (id === admin.id) redirect(`/users?error=${encodeURIComponent("Tidak bisa menghapus akun sendiri.")}`);
  await deleteUser(id);
  revalidatePath("/users");
  redirect("/users?ok=" + encodeURIComponent("User dihapus."));
}

export async function changePasswordAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const password = String(formData.get("password") ?? "");
  const back = (m: string) => redirect(`/users?error=${encodeURIComponent(m)}`);
  if (!id) redirect("/users");
  if (password.length < 6) back("Password minimal 6 karakter.");
  await changePassword(id, password);
  revalidatePath("/users");
  redirect("/users?ok=" + encodeURIComponent("Password diubah."));
}

export async function updateLowStockThresholdAction(formData: FormData) {
  await requireAdmin();
  const raw = String(formData.get("threshold") ?? "").trim();
  const n = Number(raw);
  const back = (m: string) => redirect(`/settings?error=${encodeURIComponent(m)}`);
  if (!Number.isFinite(n) || n <= 0) back("Threshold harus angka lebih dari 0.");
  await setSetting(LOW_STOCK_KEY, String(n));
  revalidatePath("/settings");
  revalidatePath("/");
  redirect("/settings?ok=" + encodeURIComponent("Threshold disimpan."));
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
