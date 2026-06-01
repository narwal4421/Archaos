# ── Stage 1: build ───────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

RUN apk add --no-cache openssl

WORKDIR /app

# Copy and install all workspace dependencies from root
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
COPY apps/web/package*.json ./apps/web/
RUN npm ci

# Copy all source
COPY . .

# cd into api workspace: prisma binary + schema are both right there
RUN cd apps/api && ./node_modules/.bin/prisma generate
RUN cd apps/api && ./node_modules/.bin/nest build

# ── Stage 2: runtime ─────────────────────────────────────────────────────────
FROM node:20-alpine AS runner

RUN apk add --no-cache openssl

WORKDIR /app

COPY --from=builder /app/apps/api/dist            ./dist
COPY --from=builder /app/apps/api/node_modules    ./node_modules
COPY --from=builder /app/apps/api/package*.json   ./
COPY --from=builder /app/apps/api/prisma          ./prisma

ENV NODE_ENV=production
ENV PORT=5000

EXPOSE 5000

# Migrate, seed, start — all paths relative to /app (the api root)
CMD ["sh", "-c", "./node_modules/.bin/prisma migrate deploy && ./node_modules/.bin/prisma db seed && node dist/main"]
