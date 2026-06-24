# Deploy to VPS via Dokploy

## Prerequisites
- Dokploy installed on the VPS.
- This repo pushed to a git remote Dokploy can read.

## Steps

1. **Postgres**: In Dokploy, create a PostgreSQL database service. Copy its connection string.
2. **Application**: Create a new Application from this git repo. Dokploy auto-detects the `Dockerfile`.
3. **Environment variables** (Application → Environment):
   - `DATABASE_URL` — the connection string from step 1.
   - `AUTH_SECRET` — generate with `openssl rand -base64 32`.
4. **Deploy**.
5. **Migrate + seed** (first deploy only) via the Dokploy app shell / a one-off container:
   ```bash
   pnpm db:migrate
   pnpm seed <email> <password> "<Name>" admin   # role: admin | user (default user)
   ```
6. **Domain**: Map a domain in Dokploy; it provisions HTTPS automatically.

## Local development

```bash
# Postgres (Docker):
docker run -d --name stockpp-db -e POSTGRES_USER=stockpp -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=stockpp -p 5432:5432 postgres:17-alpine

# .env
cp .env.example .env   # then edit DATABASE_URL / AUTH_SECRET

pnpm install
pnpm db:migrate
pnpm seed admin@bps.local admin123 Admin admin
pnpm dev                 # http://localhost:3000

# Optional demo data:
pnpm tsx --tsconfig tsconfig.json scripts/seed-demo.ts
```

## Importing the legacy Excel workbook

Loads all per-grade tabs (materials + full transaction history) from `Stock PP 2025.xlsx`.
Balances are recomputed by the weighted-average engine. **This wipes existing materials/transactions.**

```bash
pip install openpyxl
python3 scripts/parse-xlsx.py "~/Downloads/Stock PP 2025.xlsx"   # -> scripts/.import-data.json
pnpm tsx --tsconfig tsconfig.json scripts/import-xlsx.ts
```

Notes:
- The parser handles the workbook's quirks: blank-typed opening-buy rows, buys mis-logged
  in the Penjualan columns, missing/inverted dates (clamped to preserve sheet order),
  and "Average" consolidation rows.
- Historical sells carry no selling price (the old workbook only tracked cost), so their
  Profit shows "—". New sells recorded in-app can include a sale price.
- Recomputed balances can differ from the old Excel by tiny residuals (the workbook had
  manual cleanup adjustments); the engine balance is the consistent source of truth.
