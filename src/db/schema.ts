import {
  pgEnum, pgTable, uuid, text, timestamp, numeric, date, bigserial,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const txnType = pgEnum("txn_type", ["buy", "sell", "sample", "scrap"]);
export const userRole = pgEnum("user_role", ["admin", "user"]);

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  role: userRole("role").notNull().default("user"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

export const materials = pgTable(
  "materials",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    brand: text("brand").notNull(),
    grade: text("grade").notNull(),
    unit: text("unit").notNull().default("Kg"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({ brandGrade: uniqueIndex("materials_brand_grade").on(t.brand, t.grade) }),
);

export const transactions = pgTable("transactions", {
  id: uuid("id").defaultRandom().primaryKey(),
  materialId: uuid("material_id").notNull().references(() => materials.id, { onDelete: "cascade" }),
  date: date("date").notNull(),
  seq: bigserial("seq", { mode: "number" }).notNull(),
  type: txnType("type").notNull(),
  docNo: text("doc_no"),
  counterparty: text("counterparty"),
  qty: numeric("qty").notNull(),
  unitCost: numeric("unit_cost"),
  salePrice: numeric("sale_price"),
  cogs: numeric("cogs").notNull().default("0"),
  revenue: numeric("revenue").notNull().default("0"),
  profit: numeric("profit").notNull().default("0"),
  balQty: numeric("bal_qty").notNull().default("0"),
  balValue: numeric("bal_value").notNull().default("0"),
  note: text("note"),
  createdBy: uuid("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
