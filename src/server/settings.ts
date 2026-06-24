import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { settings } from "@/db/schema";

export const LOW_STOCK_KEY = "low_stock_threshold";
export const LOW_STOCK_DEFAULT = 100;

export async function getSetting(key: string): Promise<string | null> {
  const [row] = await db.select().from(settings).where(eq(settings.key, key));
  return row?.value ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  await db
    .insert(settings)
    .values({ key, value })
    .onConflictDoUpdate({ target: settings.key, set: { value } });
}

export async function getLowStockThreshold(): Promise<number> {
  const v = await getSetting(LOW_STOCK_KEY);
  const n = v == null ? NaN : Number(v);
  return Number.isFinite(n) && n > 0 ? n : LOW_STOCK_DEFAULT;
}
