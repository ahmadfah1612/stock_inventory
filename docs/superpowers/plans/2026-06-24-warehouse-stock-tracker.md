# Warehouse Stock Tracker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Next.js web app that replaces PT.BATARA PRABU SA's 47-sheet Excel stock workbook — staff record buy/sell/sample/scrap transactions per material grade and the app auto-computes weighted-average cost, running balances, profit, and a cross-grade summary.

**Architecture:** Next.js App Router (TypeScript) with Server Actions for mutations and React Server Components for display. PostgreSQL via Drizzle ORM. A pure weighted-moving-average valuation engine recomputes a material's running balances on every write. Auth.js (NextAuth v5) Credentials auth, single shared staff role. Deployed to a VPS via Dokploy with self-hosted Postgres.

**Tech Stack:** Next.js 15, TypeScript, Tailwind CSS, shadcn/ui, TanStack Table, Drizzle ORM, PostgreSQL, Auth.js v5, bcryptjs, decimal.js, Vitest, Playwright.

## Global Constraints

- Node.js >= 20.
- TypeScript strict mode on.
- Money/qty stored as Postgres `numeric`; all valuation math uses `decimal.js` (never JS float) to match Excel exactly (e.g. 51000 @ 15717.5).
- Currency display: IDR via `Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' })`. Quantity unit: Kg. Dates: `dd MMM yyyy`.
- Ledger column labels stay Indonesian: Tanggal, No SJ/Invoice, Pembelian, Penjualan, Saldo.
- Transaction types: `buy | sell | sample | scrap`. Buy = inflow; sell/sample/scrap = outflow at current avg cost.
- All mutations require an authenticated session.
- Every feature ships with tests; commit after each task.

---

## File Structure

```
stock-pp/
  src/
    db/
      schema.ts              # Drizzle tables: users, materials, transactions
      index.ts               # db client (node-postgres pool)
    lib/
      valuation.ts           # pure weighted-avg engine (no IO)
      money.ts               # IDR/qty/date formatters
      auth.ts                # Auth.js config
    server/
      materials.ts           # material queries/mutations
      transactions.ts        # transaction create/edit/delete + recompute
    app/
      layout.tsx
      login/page.tsx
      (app)/layout.tsx       # auth-guarded shell + nav
      (app)/page.tsx         # summary dashboard
      (app)/materials/page.tsx
      (app)/materials/[id]/page.tsx   # ledger (stock card)
      api/auth/[...nextauth]/route.ts
    components/
      data-table.tsx         # TanStack wrapper
      transaction-form.tsx
      material-form.tsx
  drizzle/                   # generated migrations
  scripts/
    seed-user.ts             # create first staff user
  tests/
    valuation.test.ts
    transactions.test.ts
  Dockerfile
  drizzle.config.ts
  .env.example
```

---

### Task 1: Project scaffold + tooling

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `postcss.config.mjs`, `src/app/layout.tsx`, `src/app/globals.css`, `vitest.config.ts`, `.env.example`
- Test: `tests/smoke.test.ts`

**Interfaces:**
- Produces: a runnable Next.js app + `pnpm test` wired to Vitest.

- [ ] **Step 1: Scaffold Next.js app in place**

Run (from `~/Documents/stock-pp`, which already has `.git` and `docs/`):
```bash
pnpm dlx create-next-app@latest . \
  --ts --tailwind --eslint --app --src-dir \
  --import-alias "@/*" --use-pnpm --no-turbopack --yes
```
If prompted that the directory is not empty, keep existing files (`docs/`, `.git`, `.gitignore`).

- [ ] **Step 2: Add dependencies**

```bash
pnpm add drizzle-orm pg decimal.js next-auth@beta bcryptjs @tanstack/react-table date-fns zod
pnpm add -D drizzle-kit @types/pg @types/bcryptjs vitest @vitejs/plugin-react tsx
```

- [ ] **Step 3: Configure Vitest**

Create `vitest.config.ts`:
```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  test: { environment: "node", include: ["tests/**/*.test.ts"] },
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
});
```

Add to `package.json` scripts: `"test": "vitest run"`, `"test:watch": "vitest"`, `"db:generate": "drizzle-kit generate"`, `"db:migrate": "drizzle-kit migrate"`, `"seed": "tsx scripts/seed-user.ts"`.

- [ ] **Step 4: Write smoke test**

Create `tests/smoke.test.ts`:
```ts
import { expect, test } from "vitest";
test("toolchain works", () => { expect(1 + 1).toBe(2); });
```

- [ ] **Step 5: Run it**

Run: `pnpm test`
Expected: 1 passed.

- [ ] **Step 6: Create `.env.example`**

```
DATABASE_URL=postgresql://stockpp:password@localhost:5432/stockpp
AUTH_SECRET=replace-with-openssl-rand-base64-32
```

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js app with Drizzle, Vitest, auth deps"
```

---

### Task 2: Valuation engine (TDD core)

This is the heart of the app and is pure (no IO). Build it test-first against real Excel figures.

**Files:**
- Create: `src/lib/valuation.ts`
- Test: `tests/valuation.test.ts`

**Interfaces:**
- Produces:
  ```ts
  type TxnType = "buy" | "sell" | "sample" | "scrap";
  interface TxnInput {
    type: TxnType;
    qty: string;          // decimal string, Kg
    unitCost?: string;    // buy only
    salePrice?: string;   // sell only, optional
  }
  interface TxnResult {
    cogs: string; revenue: string; profit: string;
    balQty: string; balValue: string; avgCost: string;
  }
  // Throws Error("Insufficient stock: ...") when an outflow exceeds balance.
  function computeLedger(txns: TxnInput[]): TxnResult[];
  ```

- [ ] **Step 1: Write failing tests**

Create `tests/valuation.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { computeLedger } from "@/lib/valuation";

describe("computeLedger weighted moving average", () => {
  it("single buy then sell at cost leaves zero balance", () => {
    const r = computeLedger([
      { type: "buy", qty: "10000", unitCost: "18100" },
      { type: "sell", qty: "10000", salePrice: "18100" },
    ]);
    expect(r[0].balQty).toBe("10000");
    expect(r[0].avgCost).toBe("18100");
    expect(r[1].balQty).toBe("0");
    expect(r[1].cogs).toBe("181000000");
    expect(r[1].revenue).toBe("181000000");
    expect(r[1].profit).toBe("0");
  });

  it("averages two buys then values outflow at the average (Exxon AP03B)", () => {
    const r = computeLedger([
      { type: "buy", qty: "25500", unitCost: "16089" },
      { type: "buy", qty: "25500", unitCost: "15346" },
      { type: "sell", qty: "3000", salePrice: "16000" },
    ]);
    expect(r[1].balQty).toBe("51000");
    expect(r[1].avgCost).toBe("15717.5");
    expect(r[1].balValue).toBe("801592500");
    expect(r[2].cogs).toBe("47152500");      // 3000 * 15717.5
    expect(r[2].revenue).toBe("48000000");   // 3000 * 16000
    expect(r[2].profit).toBe("847500");
  });

  it("sample reduces stock at cost with no revenue", () => {
    const r = computeLedger([
      { type: "buy", qty: "100", unitCost: "10" },
      { type: "sample", qty: "40" },
    ]);
    expect(r[1].balQty).toBe("60");
    expect(r[1].cogs).toBe("400");
    expect(r[1].revenue).toBe("0");
    expect(r[1].profit).toBe("-400");
  });

  it("scrap writes off at cost", () => {
    const r = computeLedger([
      { type: "buy", qty: "2", unitCost: "21169" },
      { type: "scrap", qty: "2" },
    ]);
    expect(r[1].balQty).toBe("0");
    expect(r[1].cogs).toBe("42338");
  });

  it("rejects overselling", () => {
    expect(() =>
      computeLedger([
        { type: "buy", qty: "10", unitCost: "5" },
        { type: "sell", qty: "20", salePrice: "6" },
      ]),
    ).toThrow(/Insufficient stock/);
  });

  it("sell without price yields null-ish revenue/profit", () => {
    const r = computeLedger([
      { type: "buy", qty: "10", unitCost: "5" },
      { type: "sell", qty: "10" },
    ]);
    expect(r[1].cogs).toBe("50");
    expect(r[1].revenue).toBe("0");
    expect(r[1].profit).toBe("-50");
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `pnpm test valuation`
Expected: FAIL — `computeLedger` not defined.

- [ ] **Step 3: Implement the engine**

Create `src/lib/valuation.ts`:
```ts
import Decimal from "decimal.js";

export type TxnType = "buy" | "sell" | "sample" | "scrap";

export interface TxnInput {
  type: TxnType;
  qty: string;
  unitCost?: string;
  salePrice?: string;
}

export interface TxnResult {
  cogs: string;
  revenue: string;
  profit: string;
  balQty: string;
  balValue: string;
  avgCost: string;
}

const s = (d: Decimal) => d.toFixed().replace(/\.?0+$/, "") || "0";

export function computeLedger(txns: TxnInput[]): TxnResult[] {
  let qty = new Decimal(0);
  let value = new Decimal(0);
  const out: TxnResult[] = [];

  for (const t of txns) {
    const q = new Decimal(t.qty);
    if (t.type === "buy") {
      const cost = new Decimal(t.unitCost ?? "0");
      qty = qty.plus(q);
      value = value.plus(q.times(cost));
      out.push(snap(qty, value, "0", "0", "0"));
    } else {
      if (q.greaterThan(qty)) {
        throw new Error(
          `Insufficient stock: tried to remove ${s(q)} but only ${s(qty)} on hand`,
        );
      }
      const avg = qty.isZero() ? new Decimal(0) : value.div(qty);
      const cogs = q.times(avg);
      qty = qty.minus(q);
      value = value.minus(cogs);
      const revenue =
        t.type === "sell" && t.salePrice != null
          ? q.times(new Decimal(t.salePrice))
          : new Decimal(0);
      const profit = revenue.minus(cogs);
      out.push(snap(qty, value, s(cogs), s(revenue), s(profit)));
    }
  }
  return out;
}

function snap(
  qty: Decimal,
  value: Decimal,
  cogs: string,
  revenue: string,
  profit: string,
): TxnResult {
  const avg = qty.isZero() ? new Decimal(0) : value.div(qty);
  return {
    cogs,
    revenue,
    profit,
    balQty: s(qty),
    balValue: s(value),
    avgCost: s(avg),
  };
}
```

- [ ] **Step 4: Run to verify pass**

Run: `pnpm test valuation`
Expected: all valuation tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/valuation.ts tests/valuation.test.ts
git commit -m "feat: weighted-moving-average valuation engine"
```

---

### Task 3: Database schema + client

**Files:**
- Create: `src/db/schema.ts`, `src/db/index.ts`, `drizzle.config.ts`
- Generates: `drizzle/` migration

**Interfaces:**
- Produces: Drizzle tables `users`, `materials`, `transactions`; `db` client exported from `src/db/index.ts`.

- [ ] **Step 1: Write the schema**

Create `src/db/schema.ts`:
```ts
import {
  pgEnum, pgTable, uuid, text, timestamp, numeric, date, bigserial,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const txnType = pgEnum("txn_type", ["buy", "sell", "sample", "scrap"]);

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
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
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
```

- [ ] **Step 2: Create db client**

Create `src/db/index.ts`:
```ts
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });
```

- [ ] **Step 3: Drizzle config**

Create `drizzle.config.ts`:
```ts
import { defineConfig } from "drizzle-kit";
export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL! },
});
```

- [ ] **Step 4: Generate migration**

Run: `pnpm db:generate`
Expected: a SQL file appears in `drizzle/`.

- [ ] **Step 5: Commit**

```bash
git add src/db drizzle.config.ts drizzle/
git commit -m "feat: drizzle schema for users, materials, transactions"
```

---

### Task 4: Auth + seed user

**Files:**
- Create: `src/lib/auth.ts`, `src/app/api/auth/[...nextauth]/route.ts`, `src/app/login/page.tsx`, `scripts/seed-user.ts`, `middleware.ts`
- Test: `tests/auth.test.ts`

**Interfaces:**
- Consumes: `users` table, `db`.
- Produces: `auth()`, `signIn`, `signOut` from `src/lib/auth.ts`; `/login` page; protected `(app)` routes.

- [ ] **Step 1: Auth config**

Create `src/lib/auth.ts`:
```ts
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      authorize: async (c) => {
        const email = String(c?.email ?? "");
        const password = String(c?.password ?? "");
        const [u] = await db.select().from(users).where(eq(users.email, email));
        if (!u) return null;
        if (!(await bcrypt.compare(password, u.passwordHash))) return null;
        return { id: u.id, email: u.email, name: u.name };
      },
    }),
  ],
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
});
```

Create `src/app/api/auth/[...nextauth]/route.ts`:
```ts
import { handlers } from "@/lib/auth";
export const { GET, POST } = handlers;
```

- [ ] **Step 2: Route protection**

Create `middleware.ts`:
```ts
import { auth } from "@/lib/auth";
export default auth((req) => {
  const onLogin = req.nextUrl.pathname.startsWith("/login");
  if (!req.auth && !onLogin) {
    return Response.redirect(new URL("/login", req.nextUrl));
  }
});
export const config = { matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"] };
```

- [ ] **Step 3: Login page**

Create `src/app/login/page.tsx`:
```tsx
import { signIn } from "@/lib/auth";
import { redirect } from "next/navigation";

export default function LoginPage() {
  async function login(formData: FormData) {
    "use server";
    try {
      await signIn("credentials", {
        email: formData.get("email"),
        password: formData.get("password"),
        redirectTo: "/",
      });
    } catch (e) {
      if ((e as Error).message === "NEXT_REDIRECT") throw e;
      redirect("/login?error=1");
    }
  }
  return (
    <main className="mx-auto mt-24 max-w-sm space-y-4">
      <h1 className="text-xl font-semibold">Stock PP — Login</h1>
      <form action={login} className="space-y-3">
        <input name="email" type="email" placeholder="Email" required className="w-full border p-2 rounded" />
        <input name="password" type="password" placeholder="Password" required className="w-full border p-2 rounded" />
        <button className="w-full bg-black text-white p-2 rounded">Masuk</button>
      </form>
    </main>
  );
}
```

- [ ] **Step 4: Seed script**

Create `scripts/seed-user.ts`:
```ts
import bcrypt from "bcryptjs";
import { db } from "@/db";
import { users } from "@/db/schema";

const [email, password, name] = process.argv.slice(2);
if (!email || !password) {
  console.error("Usage: pnpm seed <email> <password> [name]");
  process.exit(1);
}
const hash = await bcrypt.hash(password, 10);
await db.insert(users).values({ email, passwordHash: hash, name: name ?? "Staff" });
console.log("Created user", email);
process.exit(0);
```

Add `"type": "module"` is already set by Next; run seed with `pnpm tsx scripts/seed-user.ts`. Add tsconfig path alias resolution for tsx by adding to `package.json`: `"seed": "tsx --tsconfig tsconfig.json scripts/seed-user.ts"` and ensure `tsconfig.json` has `"paths": { "@/*": ["./src/*"] }`.

- [ ] **Step 5: Auth unit test**

Create `tests/auth.test.ts`:
```ts
import { expect, test } from "vitest";
import bcrypt from "bcryptjs";

test("password hash round-trips", async () => {
  const hash = await bcrypt.hash("secret", 10);
  expect(await bcrypt.compare("secret", hash)).toBe(true);
  expect(await bcrypt.compare("wrong", hash)).toBe(false);
});
```

Run: `pnpm test auth`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/auth.ts "src/app/api/auth/[...nextauth]/route.ts" src/app/login middleware.ts scripts/seed-user.ts tests/auth.test.ts
git commit -m "feat: credentials auth, login page, route guard, seed script"
```

---

### Task 5: Transaction server layer with recompute

**Files:**
- Create: `src/server/transactions.ts`, `src/server/materials.ts`
- Test: `tests/transactions.test.ts` (engine-integration; pure recompute helper extracted so it is testable without a DB)

**Interfaces:**
- Consumes: `computeLedger`, `db`, schema tables.
- Produces:
  ```ts
  // materials.ts
  function listMaterialsWithBalance(): Promise<MaterialSummary[]>;
  function createMaterial(input: { brand: string; grade: string }): Promise<void>;
  // transactions.ts
  function listLedger(materialId: string): Promise<LedgerRow[]>;
  function addTransaction(input: AddTxnInput): Promise<void>;   // recomputes after insert
  function applyLedger(materialId: string): Promise<void>;      // recompute + persist snapshots
  type MaterialSummary = { id: string; brand: string; grade: string; balQty: string; avgCost: string; balValue: string };
  ```

- [ ] **Step 1: Write the recompute test (pure helper)**

The recompute maps DB rows → `TxnInput[]`, runs `computeLedger`, and zips results back. Extract the mapping so it is unit-testable. Create `tests/transactions.test.ts`:
```ts
import { expect, test } from "vitest";
import { toLedgerInputs } from "@/server/transactions";

test("maps db rows to engine inputs preserving type and amounts", () => {
  const rows = [
    { type: "buy", qty: "100", unitCost: "10", salePrice: null },
    { type: "sell", qty: "40", unitCost: null, salePrice: "12" },
  ] as const;
  expect(toLedgerInputs(rows as any)).toEqual([
    { type: "buy", qty: "100", unitCost: "10", salePrice: undefined },
    { type: "sell", qty: "40", unitCost: undefined, salePrice: "12" },
  ]);
});
```

- [ ] **Step 2: Run to verify failure**

Run: `pnpm test transactions`
Expected: FAIL — `toLedgerInputs` not defined.

- [ ] **Step 3: Implement materials server**

Create `src/server/materials.ts`:
```ts
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
```

- [ ] **Step 4: Implement transactions server**

Create `src/server/transactions.ts`:
```ts
import "server-only";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { transactions } from "@/db/schema";
import { computeLedger, type TxnInput } from "@/lib/valuation";

type Row = { type: string; qty: string; unitCost: string | null; salePrice: string | null };

export function toLedgerInputs(rows: readonly Row[]): TxnInput[] {
  return rows.map((r) => ({
    type: r.type as TxnInput["type"],
    qty: r.qty,
    unitCost: r.unitCost ?? undefined,
    salePrice: r.salePrice ?? undefined,
  }));
}

export interface AddTxnInput {
  materialId: string;
  date: string;
  type: TxnInput["type"];
  qty: string;
  unitCost?: string;
  salePrice?: string;
  docNo?: string;
  counterparty?: string;
  note?: string;
  createdBy?: string;
}

export async function listLedger(materialId: string) {
  return db.select().from(transactions)
    .where(eq(transactions.materialId, materialId))
    .orderBy(asc(transactions.date), asc(transactions.seq));
}

export async function applyLedger(materialId: string) {
  const rows = await listLedger(materialId);
  const results = computeLedger(toLedgerInputs(rows));
  for (let i = 0; i < rows.length; i++) {
    const r = results[i];
    await db.update(transactions).set({
      cogs: r.cogs, revenue: r.revenue, profit: r.profit,
      balQty: r.balQty, balValue: r.balValue,
    }).where(eq(transactions.id, rows[i].id));
  }
}

export async function addTransaction(input: AddTxnInput) {
  await db.insert(transactions).values({
    materialId: input.materialId,
    date: input.date,
    type: input.type,
    qty: input.qty,
    unitCost: input.unitCost ?? null,
    salePrice: input.salePrice ?? null,
    docNo: input.docNo ?? null,
    counterparty: input.counterparty ?? null,
    note: input.note ?? null,
    createdBy: input.createdBy ?? null,
  });
  await applyLedger(input.materialId);   // recompute throws on oversell → row stays but invalid; see Step 5
}
```

- [ ] **Step 5: Guard oversell before insert**

`applyLedger` throws on oversell, but the bad row is already inserted. Wrap insert+recompute so a throw rolls back. Replace `addTransaction` body with a transaction:
```ts
export async function addTransaction(input: AddTxnInput) {
  await db.transaction(async (tx) => {
    await tx.insert(transactions).values({
      materialId: input.materialId, date: input.date, type: input.type, qty: input.qty,
      unitCost: input.unitCost ?? null, salePrice: input.salePrice ?? null,
      docNo: input.docNo ?? null, counterparty: input.counterparty ?? null,
      note: input.note ?? null, createdBy: input.createdBy ?? null,
    });
    const rows = await tx.select().from(transactions)
      .where(eq(transactions.materialId, input.materialId))
      .orderBy(asc(transactions.date), asc(transactions.seq));
    const results = computeLedger(toLedgerInputs(rows)); // throws → tx rolls back
    for (let i = 0; i < rows.length; i++) {
      const r = results[i];
      await tx.update(transactions).set({
        cogs: r.cogs, revenue: r.revenue, profit: r.profit,
        balQty: r.balQty, balValue: r.balValue,
      }).where(eq(transactions.id, rows[i].id));
    }
  });
}
```
Keep the standalone `applyLedger` for edit/delete reuse.

- [ ] **Step 6: Run tests**

Run: `pnpm test transactions`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/server tests/transactions.test.ts
git commit -m "feat: transaction + material server layer with recompute on write"
```

---

### Task 6: Summary dashboard + app shell

**Files:**
- Create: `src/app/(app)/layout.tsx`, `src/app/(app)/page.tsx`, `src/lib/money.ts`, `src/components/data-table.tsx`
- Test: `tests/money.test.ts`

**Interfaces:**
- Consumes: `listMaterialsWithBalance`, `auth`.
- Produces: formatters `formatIDR`, `formatQty`, `formatDate`; `<DataTable>`.

- [ ] **Step 1: Formatters test**

Create `tests/money.test.ts`:
```ts
import { expect, test } from "vitest";
import { formatIDR, formatQty } from "@/lib/money";

test("formats IDR without decimals", () => {
  expect(formatIDR("566149500")).toMatch(/Rp/);
  expect(formatIDR("566149500")).toContain("566.149.500");
});
test("formats qty with Kg", () => {
  expect(formatQty("31500")).toBe("31.500 Kg");
});
```

- [ ] **Step 2: Run — fails**

Run: `pnpm test money`
Expected: FAIL.

- [ ] **Step 3: Implement formatters**

Create `src/lib/money.ts`:
```ts
const idr = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });
const num = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 });

export const formatIDR = (v: string | number) => idr.format(Number(v));
export const formatQty = (v: string | number) => `${num.format(Number(v))} Kg`;
export const formatDate = (v: string | Date) =>
  new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(v));
```

Run: `pnpm test money` → PASS.

- [ ] **Step 4: App shell with nav + sign-out**

Create `src/app/(app)/layout.tsx`:
```tsx
import Link from "next/link";
import { auth, signOut } from "@/lib/auth";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between border-b px-6 py-3">
        <nav className="flex gap-4">
          <Link href="/" className="font-semibold">Summary</Link>
          <Link href="/materials">Materials</Link>
        </nav>
        <form action={async () => { "use server"; await signOut({ redirectTo: "/login" }); }}>
          <span className="mr-3 text-sm text-gray-500">{session?.user?.name}</span>
          <button className="text-sm underline">Keluar</button>
        </form>
      </header>
      <main className="p-6">{children}</main>
    </div>
  );
}
```

- [ ] **Step 5: Generic DataTable**

Create `src/components/data-table.tsx`:
```tsx
"use client";
import { type ColumnDef, flexRender, getCoreRowModel, getSortedRowModel, useReactTable, type SortingState } from "@tanstack/react-table";
import { useState } from "react";

export function DataTable<T>({ columns, data }: { columns: ColumnDef<T, any>[]; data: T[] }) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const table = useReactTable({ data, columns, state: { sorting }, onSortingChange: setSorting, getCoreRowModel: getCoreRowModel(), getSortedRowModel: getSortedRowModel() });
  return (
    <table className="w-full border-collapse text-sm">
      <thead>
        {table.getHeaderGroups().map((hg) => (
          <tr key={hg.id} className="border-b bg-gray-50">
            {hg.headers.map((h) => (
              <th key={h.id} onClick={h.column.getToggleSortingHandler()} className="cursor-pointer p-2 text-left font-medium">
                {flexRender(h.column.columnDef.header, h.getContext())}
              </th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody>
        {table.getRowModel().rows.map((r) => (
          <tr key={r.id} className="border-b hover:bg-gray-50">
            {r.getVisibleCells().map((c) => (
              <td key={c.id} className="p-2">{flexRender(c.column.columnDef.cell, c.getContext())}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

- [ ] **Step 6: Summary page**

Create `src/app/(app)/page.tsx`:
```tsx
import Link from "next/link";
import { listMaterialsWithBalance } from "@/server/materials";
import { formatIDR, formatQty } from "@/lib/money";

export default async function SummaryPage() {
  const rows = await listMaterialsWithBalance();
  const totalValue = rows.reduce((a, r) => a + Number(r.balValue), 0);
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <Card label="Total Inventory Value" value={formatIDR(totalValue)} />
        <Card label="Grades" value={String(rows.length)} />
        <Card label="Out of Stock" value={String(rows.filter((r) => Number(r.balQty) === 0).length)} />
      </div>
      <table className="w-full border-collapse text-sm">
        <thead><tr className="border-b bg-gray-50 text-left">
          <th className="p-2">Stock</th><th className="p-2">Grade</th>
          <th className="p-2 text-right">Qty (Kg)</th><th className="p-2 text-right">Price/Kg</th>
          <th className="p-2 text-right">Total</th>
        </tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-b hover:bg-gray-50">
              <td className="p-2"><Link href={`/materials/${r.id}`} className="underline">{r.brand}</Link></td>
              <td className="p-2">{r.grade}</td>
              <td className="p-2 text-right">{formatQty(r.balQty)}</td>
              <td className="p-2 text-right">{formatIDR(r.avgCost)}</td>
              <td className="p-2 text-right">{formatIDR(r.balValue)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot><tr className="border-t font-semibold">
          <td className="p-2" colSpan={4}>Total</td>
          <td className="p-2 text-right">{formatIDR(totalValue)}</td>
        </tr></tfoot>
      </table>
    </div>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return <div className="rounded border p-4"><div className="text-xs text-gray-500">{label}</div><div className="text-lg font-semibold">{value}</div></div>;
}
```

- [ ] **Step 7: Manual verify + commit**

Run: `pnpm build` (expect success). Then:
```bash
git add src/app "src/app/(app)" src/lib/money.ts src/components/data-table.tsx tests/money.test.ts
git commit -m "feat: app shell, formatters, summary dashboard"
```

---

### Task 7: Material ledger (stock card) page

**Files:**
- Create: `src/app/(app)/materials/[id]/page.tsx`, `src/components/ledger-table.tsx`

**Interfaces:**
- Consumes: `listLedger`, material row, formatters.
- Produces: the Excel-style stock card view.

- [ ] **Step 1: Ledger table component**

Create `src/components/ledger-table.tsx`:
```tsx
import { formatDate, formatIDR, formatQty } from "@/lib/money";

type Row = {
  id: string; date: string; type: string; docNo: string | null; counterparty: string | null;
  qty: string; unitCost: string | null; salePrice: string | null;
  cogs: string; revenue: string; profit: string; balQty: string; balValue: string;
};

export function LedgerTable({ rows }: { rows: Row[] }) {
  return (
    <table className="w-full border-collapse text-xs">
      <thead>
        <tr className="bg-gray-100 text-left">
          <th className="border p-1" rowSpan={2}>Tanggal</th>
          <th className="border p-1" rowSpan={2}>No SJ/Invoice</th>
          <th className="border p-1" rowSpan={2}>Tipe</th>
          <th className="border p-1" rowSpan={2}>Customer</th>
          <th className="border p-1 text-center" colSpan={3}>Pembelian</th>
          <th className="border p-1 text-center" colSpan={3}>Penjualan</th>
          <th className="border p-1 text-center" colSpan={3}>Saldo</th>
          <th className="border p-1" rowSpan={2}>Profit</th>
        </tr>
        <tr className="bg-gray-50">
          {["Unit","Harga","Jumlah","Unit","Harga","Jumlah","Unit","Harga","Jumlah"].map((h, i) => (
            <th key={i} className="border p-1 text-right">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => {
          const isBuy = r.type === "buy";
          const avg = Number(r.balQty) === 0 ? "0" : String(Number(r.balValue) / Number(r.balQty));
          return (
            <tr key={r.id} className="border-b">
              <td className="border p-1">{formatDate(r.date)}</td>
              <td className="border p-1">{r.docNo ?? "-"}</td>
              <td className="border p-1 capitalize">{r.type}</td>
              <td className="border p-1">{r.counterparty ?? "-"}</td>
              <td className="border p-1 text-right">{isBuy ? formatQty(r.qty) : ""}</td>
              <td className="border p-1 text-right">{isBuy ? formatIDR(r.unitCost ?? 0) : ""}</td>
              <td className="border p-1 text-right">{isBuy ? formatIDR(Number(r.qty) * Number(r.unitCost ?? 0)) : ""}</td>
              <td className="border p-1 text-right">{!isBuy ? formatQty(r.qty) : ""}</td>
              <td className="border p-1 text-right">{!isBuy ? formatIDR(r.salePrice ?? r.cogs) : ""}</td>
              <td className="border p-1 text-right">{!isBuy ? formatIDR(r.revenue !== "0" ? r.revenue : r.cogs) : ""}</td>
              <td className="border p-1 text-right">{formatQty(r.balQty)}</td>
              <td className="border p-1 text-right">{formatIDR(avg)}</td>
              <td className="border p-1 text-right">{formatIDR(r.balValue)}</td>
              <td className="border p-1 text-right">{!isBuy && r.revenue !== "0" ? formatIDR(r.profit) : "-"}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
```

- [ ] **Step 2: Ledger page**

Create `src/app/(app)/materials/[id]/page.tsx`:
```tsx
import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { materials } from "@/db/schema";
import { listLedger } from "@/server/transactions";
import { LedgerTable } from "@/components/ledger-table";

export default async function LedgerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [mat] = await db.select().from(materials).where(eq(materials.id, id));
  if (!mat) return <div>Material not found.</div>;
  const rows = await listLedger(id);
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">{mat.brand} {mat.grade}</h1>
        <Link href={`/materials/${id}/new`} className="rounded bg-black px-3 py-1.5 text-sm text-white">+ Transaksi</Link>
      </div>
      <LedgerTable rows={rows as any} />
    </div>
  );
}
```

- [ ] **Step 3: Build check + commit**

Run: `pnpm build`
Expected: success.
```bash
git add "src/app/(app)/materials" src/components/ledger-table.tsx
git commit -m "feat: material ledger stock-card page"
```

---

### Task 8: Add-transaction form + server action

**Files:**
- Create: `src/app/(app)/materials/[id]/new/page.tsx`, `src/components/transaction-form.tsx`, `src/server/actions.ts`

**Interfaces:**
- Consumes: `addTransaction`, `auth`, `zod`.
- Produces: validated transaction creation flow that redirects back to the ledger.

- [ ] **Step 1: Zod-validated server action**

Create `src/server/actions.ts`:
```ts
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
```

- [ ] **Step 2: Transaction form (type-adaptive)**

Create `src/components/transaction-form.tsx`:
```tsx
"use client";
import { useState } from "react";
import { createTransactionAction } from "@/server/actions";

export function TransactionForm({ materialId, error }: { materialId: string; error?: string }) {
  const [type, setType] = useState("buy");
  return (
    <form action={createTransactionAction} className="max-w-md space-y-3">
      {error && <p className="rounded bg-red-50 p-2 text-sm text-red-700">{error}</p>}
      <input type="hidden" name="materialId" value={materialId} />
      <label className="block text-sm">Tanggal
        <input name="date" type="date" required className="mt-1 w-full border p-2 rounded" />
      </label>
      <label className="block text-sm">Tipe
        <select name="type" value={type} onChange={(e) => setType(e.target.value)} className="mt-1 w-full border p-2 rounded">
          <option value="buy">Buy</option><option value="sell">Sell</option>
          <option value="sample">Sample</option><option value="scrap">Scrap</option>
        </select>
      </label>
      <label className="block text-sm">Qty (Kg)
        <input name="qty" inputMode="decimal" required className="mt-1 w-full border p-2 rounded" />
      </label>
      {type === "buy" && (
        <label className="block text-sm">Harga Beli / Kg
          <input name="unitCost" inputMode="decimal" required className="mt-1 w-full border p-2 rounded" />
        </label>
      )}
      {type === "sell" && (
        <label className="block text-sm">Harga Jual / Kg (opsional)
          <input name="salePrice" inputMode="decimal" className="mt-1 w-full border p-2 rounded" />
        </label>
      )}
      <label className="block text-sm">No SJ/Invoice
        <input name="docNo" className="mt-1 w-full border p-2 rounded" />
      </label>
      <label className="block text-sm">Customer/Supplier
        <input name="counterparty" className="mt-1 w-full border p-2 rounded" />
      </label>
      <button className="rounded bg-black px-4 py-2 text-white">Simpan</button>
    </form>
  );
}
```

- [ ] **Step 3: New-transaction page**

Create `src/app/(app)/materials/[id]/new/page.tsx`:
```tsx
import { TransactionForm } from "@/components/transaction-form";

export default async function NewTxnPage({
  params, searchParams,
}: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  const { id } = await params;
  const { error } = await searchParams;
  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Transaksi Baru</h1>
      <TransactionForm materialId={id} error={error} />
    </div>
  );
}
```

- [ ] **Step 4: Manual E2E check**

Start Postgres locally, run `pnpm db:migrate`, `pnpm seed admin@bps.local pass123 Admin`, `pnpm dev`. Log in, create a material, add a buy then a sell, confirm the ledger + summary update and that overselling is rejected with a visible error.

- [ ] **Step 5: Commit**

```bash
git add "src/app/(app)/materials" src/components/transaction-form.tsx src/server/actions.ts
git commit -m "feat: add-transaction form with validated server action"
```

---

### Task 9: Materials management page

**Files:**
- Create: `src/app/(app)/materials/page.tsx`, `src/components/material-form.tsx`

**Interfaces:**
- Consumes: `listMaterialsWithBalance`, `createMaterialAction`.

- [ ] **Step 1: Material form**

Create `src/components/material-form.tsx`:
```tsx
import { createMaterialAction } from "@/server/actions";

export function MaterialForm() {
  return (
    <form action={createMaterialAction} className="flex gap-2">
      <input name="brand" placeholder="Stock (e.g. Exxon)" required className="border p-2 rounded" />
      <input name="grade" placeholder="Grade (e.g. AP03B)" required className="border p-2 rounded" />
      <button className="rounded bg-black px-4 text-white">+ Tambah</button>
    </form>
  );
}
```

- [ ] **Step 2: Materials page**

Create `src/app/(app)/materials/page.tsx`:
```tsx
import Link from "next/link";
import { listMaterialsWithBalance } from "@/server/materials";
import { MaterialForm } from "@/components/material-form";
import { formatIDR, formatQty } from "@/lib/money";

export default async function MaterialsPage() {
  const rows = await listMaterialsWithBalance();
  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Materials</h1>
      <MaterialForm />
      <ul className="divide-y border rounded">
        {rows.map((r) => (
          <li key={r.id} className="flex justify-between p-2">
            <Link href={`/materials/${r.id}`} className="underline">{r.brand} {r.grade}</Link>
            <span className="text-sm text-gray-600">{formatQty(r.balQty)} · {formatIDR(r.balValue)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

- [ ] **Step 3: Build + commit**

Run: `pnpm build`
```bash
git add "src/app/(app)/materials/page.tsx" src/components/material-form.tsx
git commit -m "feat: materials management page"
```

---

### Task 10: CSV export

**Files:**
- Create: `src/app/(app)/export/route.ts`
- Modify: `src/app/(app)/layout.tsx` (add Export nav link)

**Interfaces:**
- Consumes: `listMaterialsWithBalance`.
- Produces: `/export` downloadable CSV of the summary.

- [ ] **Step 1: Export route**

Create `src/app/(app)/export/route.ts`:
```ts
import { listMaterialsWithBalance } from "@/server/materials";

export async function GET() {
  const rows = await listMaterialsWithBalance();
  const header = "Stock,Grade,Qty (Kg),Price/Kg,Total";
  const body = rows.map((r) =>
    [r.brand, r.grade, r.balQty, r.avgCost, r.balValue]
      .map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","),
  ).join("\n");
  return new Response(`${header}\n${body}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="stock-summary.csv"`,
    },
  });
}
```

- [ ] **Step 2: Add nav link**

In `src/app/(app)/layout.tsx`, inside `<nav>`, add after the Materials link:
```tsx
<a href="/export">Export</a>
```

- [ ] **Step 3: Build + commit**

Run: `pnpm build`
```bash
git add "src/app/(app)/export/route.ts" "src/app/(app)/layout.tsx"
git commit -m "feat: CSV export of stock summary"
```

---

### Task 11: Dockerfile + Dokploy deploy

**Files:**
- Create: `Dockerfile`, `.dockerignore`
- Modify: `next.config.ts` (enable standalone output), `docs/DEPLOY.md`

**Interfaces:**
- Produces: a container image Dokploy can build and run.

- [ ] **Step 1: Standalone output**

In `next.config.ts` set:
```ts
import type { NextConfig } from "next";
const nextConfig: NextConfig = { output: "standalone" };
export default nextConfig;
```

- [ ] **Step 2: Dockerfile**

Create `Dockerfile`:
```dockerfile
FROM node:20-alpine AS base
RUN corepack enable
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

FROM base AS run
ENV NODE_ENV=production
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
COPY --from=build /app/drizzle ./drizzle
EXPOSE 3000
CMD ["node", "server.js"]
```

Create `.dockerignore`:
```
node_modules
.next
.git
docs
```

- [ ] **Step 3: Deploy notes**

Create `docs/DEPLOY.md`:
```md
# Deploy to VPS via Dokploy

1. In Dokploy, create a Postgres database service. Note its connection string.
2. Create a new Application from this git repo (Dockerfile build).
3. Set env vars: DATABASE_URL (from step 1), AUTH_SECRET (`openssl rand -base64 32`).
4. Deploy. After first deploy, run migrations + seed via Dokploy shell:
   - `node_modules/.bin/drizzle-kit migrate` (or run `pnpm db:migrate` in a one-off container)
   - `pnpm seed <email> <password> <name>`
5. Map a domain in Dokploy; it provisions HTTPS automatically.
```

- [ ] **Step 4: Verify build + commit**

Run: `docker build -t stock-pp .`
Expected: image builds.
```bash
git add Dockerfile .dockerignore next.config.ts docs/DEPLOY.md
git commit -m "chore: dockerfile and dokploy deploy docs"
```

---

## Self-Review

**Spec coverage:**
- §2 scope — login (T4), materials mgmt (T9), transactions buy/sell/sample/scrap (T2/T5/T8), valuation engine (T2), summary dashboard (T6), per-grade ledger (T7), revenue/profit (T2/T7), CSV export (T10), fresh start (no import task — correct), Dokploy deploy (T11). ✓
- §3 domain rules — weighted moving average, outflow at avg cost, sample/scrap no revenue, oversell guard: all in T2 + T5. ✓
- §5 data model — three tables in T3 match spec columns. ✓
- §6 valuation engine — T2 implements the exact fold, incl. decimal precision and guards. ✓
- §7 pages — all 6 covered (login T4, summary T6, ledger T7, add/edit T8, materials T9, export T10). Edit/delete of an existing transaction is reachable via `applyLedger` reuse but no dedicated UI task — **noted as a v1.1 follow-up** (add an edit page reusing TransactionForm + an `editTransaction` action that re-runs `applyLedger`).
- §8 error handling — validation in T8 action, oversell rollback in T5, auth guard T4. ✓
- §9 testing — engine (T2), formatters (T6), mapping (T5), auth hash (T4); E2E smoke is manual in T8. ✓
- §10 deployment — T11. ✓

**Placeholder scan:** No TBD/TODO; all code steps contain full code. ✓

**Type consistency:** `computeLedger`/`TxnInput`/`TxnResult` consistent T2→T5. `toLedgerInputs`, `addTransaction`, `applyLedger`, `listLedger`, `listMaterialsWithBalance`, `createMaterial` consistent across T5/T6/T7/T8/T9/T10. Action names `createTransactionAction`/`createMaterialAction` consistent T8→T9. ✓

One intentional deferral: transaction **edit/delete UI** is v1.1 (server-side `applyLedger` already supports recompute). Everything in the approved spec's v1 scope is covered.
