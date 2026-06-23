# Warehouse Stock Tracker — Design Spec

**Date:** 2026-06-24
**Project:** Stock PP — warehouse inventory tracker for PT.BATARA PRABU SA
**Status:** Approved, ready for implementation planning

## 1. Purpose

PT.BATARA PRABU SA trades plastic resin (polypropylene / PP grades). Today they track
warehouse stock in a 47-sheet Excel workbook (`Stock PP 2025.xlsx`): one Summary sheet plus
one running stock card (kartu stok) per material grade. This app replaces that workbook as the
source of truth: staff record buy/sell/sample/scrap transactions per grade, and the app
auto-computes running balances, weighted-average cost, and a cross-grade summary.

Improvement over the Excel: the app also records selling price and shows revenue / COGS / profit
on sales (the Excel only tracked stock at cost).

## 2. Scope

**In scope (v1):**
- Email + password login (few staff, single shared role).
- Materials (brand + grade) management.
- Record transactions: Buy, Sell, Sample, Scrap.
- Weighted moving-average cost valuation engine.
- Summary dashboard across all grades.
- Per-grade ledger (stock card) mirroring the Excel layout.
- Revenue / profit tracking on sales.
- CSV/Excel export.
- Fresh start (no import of the legacy 47-sheet history).
- Deploy to user's VPS via Dokploy + self-hosted Postgres.

**Out of scope (v1):**
- Multi-warehouse / locations.
- Supplier & customer master tables (counterparty is free text).
- Purchase-order / approval workflow.
- Importing the legacy Excel transaction history.
- Role-based permissions beyond a single shared staff role.

## 3. Domain rules (derived from the Excel)

The Excel stock card is a **cost-valuation** ledger. Observed behavior:

- **Weighted moving average cost.** When stock accumulates from multiple buys at different
  prices, the cost is averaged. Example from `Exxon AP03B`: buy 25500 @ 16089 + buy 25500 @
  15346 → balance 51000 @ **15717.5** (= total value / total qty). Subsequent outflows leave at
  that averaged cost.
- **Outflows leave at current average cost.** A sell of 6000 units recorded `Harga = 18078`,
  identical to the buy cost — i.e. the ledger's sell price column is the **cost basis (COGS)**,
  not the selling price. The legacy Excel never recorded revenue.
- **Transaction types found:** Buy, Sell, Sample, Scrap.
  - **Buy** — inflow. Adds qty at purchase unit cost; recomputes average.
  - **Sell** — outflow at average cost; (new) also records selling price → revenue & profit.
  - **Sample** — outflow at average cost, no revenue (goods leave free).
  - **Scrap** — outflow at average cost, write-off, no revenue.
- Quantities are in **Kg** (can be fractional, e.g. 6025, 25). Currency is **IDR (Rp)**;
  costs carry decimals (e.g. 15717.5, 16337.642…).

## 4. Architecture

- **Frontend/Backend:** Next.js (App Router, TypeScript). Server Actions / Route Handlers for
  mutations; React Server Components for data display.
- **UI:** Tailwind CSS + shadcn/ui. TanStack Table for sortable, sticky-header, Excel-like grids.
- **Database:** PostgreSQL (self-hosted on the VPS).
- **ORM/migrations:** Drizzle ORM (type-safe schema + SQL migrations).
- **Auth:** Auth.js (NextAuth v5) Credentials provider; bcrypt password hashes; session cookie.
  Single shared "staff" role.
- **Money precision:** store qty and value as Postgres `numeric`; run the valuation engine with a
  decimal library (decimal.js) to match Excel's averaging exactly; round only for display.
- **Deploy:** Dockerfile (Next.js standalone) → Dokploy application. Postgres as a Dokploy
  service. Env: `DATABASE_URL`, `AUTH_SECRET`.

## 5. Data model

### users
| col | type | notes |
|-----|------|-------|
| id | uuid pk | |
| email | text unique | login |
| password_hash | text | bcrypt |
| name | text | |
| created_at | timestamptz | |

### materials
| col | type | notes |
|-----|------|-------|
| id | uuid pk | |
| brand | text | the Excel "Stock" column, e.g. "Exxon" |
| grade | text | e.g. "AP03B" |
| unit | text | default 'Kg' |
| created_at | timestamptz | |

Unique constraint on (brand, grade).

### transactions
| col | type | notes |
|-----|------|-------|
| id | uuid pk | |
| material_id | uuid fk → materials | |
| date | date | Tanggal |
| seq | bigserial | tiebreaker for same-date ordering |
| type | enum `buy|sell|sample|scrap` | |
| doc_no | text null | No SJ/Invoice |
| counterparty | text null | Customer / Supplier (free text) |
| qty | numeric | Kg |
| unit_cost | numeric null | Buy: purchase price/Kg |
| sale_price | numeric null | Sell: optional selling price/Kg |
| cogs | numeric | engine-computed: qty × avg cost at time of outflow |
| revenue | numeric | engine-computed: qty × sale_price (sell only) |
| profit | numeric | engine-computed: revenue − cogs |
| bal_qty | numeric | engine-computed running balance qty |
| bal_value | numeric | engine-computed running balance value (avg = bal_value/bal_qty) |
| note | text null | |
| created_by | uuid fk → users | |
| created_at | timestamptz | |

Engine-computed columns (`cogs`, `revenue`, `profit`, `bal_qty`, `bal_value`) are derived — see §6.

## 6. Valuation engine

Pure function: given a material's transactions ordered by `(date, seq)`, fold to produce each
row's snapshot. Re-run for the affected material on every add / edit / delete (full recompute is
cheap at this scale and is always correct).

State: `qty = 0`, `value = 0`. For each transaction in order:

- **Buy:** `qty += t.qty`; `value += t.qty * t.unit_cost`. `cogs = revenue = profit = 0`.
- **Sell / Sample / Scrap:**
  - `avg = qty > 0 ? value / qty : 0`
  - `cogs = t.qty * avg`
  - `qty -= t.qty`; `value -= cogs`
  - **Sell with sale_price:** `revenue = t.qty * sale_price`; `profit = revenue - cogs`.
  - **Sample / Scrap / Sell without price:** `revenue = 0` (or null), `profit = -cogs` for
    sample/scrap, null for price-less sell.
- Persist `bal_qty = qty`, `bal_value = value` per row.

**Guards:**
- Outflow qty greater than current balance → reject with a clear error.
- Buy requires `unit_cost`. Outflows require `qty`. `sale_price` valid only on Sell.

Decimal precision via decimal.js to reproduce Excel averages exactly.

## 7. Pages

1. **Login** — email + password.
2. **Summary dashboard** — table of all grades: brand, grade, qty on hand, avg cost, total value;
   total row; KPI cards (total inventory value, number of grades, low-stock count). Search + sort.
   Mirrors the Excel Summary sheet.
3. **Material ledger (stock card)** — full transaction grid mirroring the Excel:
   Tanggal · No SJ/Invoice · Type · Customer · **Pembelian** (Unit/Harga/Jumlah) ·
   **Penjualan** (Unit/Harga/Jumlah) · **Saldo** (Unit/Harga/Jumlah), plus Revenue / Profit on
   sales. "Add transaction" button. Indonesian column labels retained.
4. **Add / edit transaction** — form adapts to type (Buy → unit cost; Sell → optional sale price;
   Sample/Scrap → qty only). Date, doc no, counterparty, note.
5. **Materials** — list + add new brand/grade.
6. **Export** — CSV/Excel of the summary and per-grade ledgers.

Formatting: IDR (`Rp`, id-ID locale) for money; Kg for quantity; `dd MMM yyyy` dates.

## 8. Error handling

- Validation errors (negative qty, overselling, missing required field) surface inline on the form
  and as server-action errors; no transaction is written on failure.
- Auth: unauthenticated requests redirect to login; all mutations require a session.
- DB constraint violations (duplicate brand+grade) return a friendly message.

## 9. Testing

- **Unit:** valuation engine — multi-buy averaging, oversell guard, sample/scrap, profit math,
  decimal precision against the `Exxon AP03B` figures (51000 @ 15717.5, etc.).
- **Integration:** transaction create → balance recompute → summary reflects new totals.
- **Auth:** protected routes redirect when logged out.
- **E2E (smoke):** login → add material → record buy → record sell → verify ledger + summary.

## 10. Deployment

- Dockerfile building Next.js standalone output.
- Dokploy application pointing at the repo; Dokploy-managed Postgres service.
- Env: `DATABASE_URL`, `AUTH_SECRET`. Run Drizzle migrations on deploy.
- Seed script to create the first staff user.
