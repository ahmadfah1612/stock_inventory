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
   pnpm seed <email> <password> "<Name>"
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
pnpm seed admin@bps.local admin123 Admin
pnpm dev                 # http://localhost:3000

# Optional demo data:
pnpm tsx --tsconfig tsconfig.json scripts/seed-demo.ts
```
