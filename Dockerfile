FROM node:22-alpine AS base
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
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
COPY --from=build /app/drizzle ./drizzle
COPY --from=build /app/scripts/migrate.mjs ./scripts/migrate.mjs
# Full drizzle-orm package so the migrator submodule is available at runtime
# (Next standalone only traces files the app imports, not the migrate script).
COPY --from=deps /app/node_modules/drizzle-orm ./node_modules/drizzle-orm
EXPOSE 3000
CMD ["sh", "-c", "node scripts/migrate.mjs && node server.js"]
