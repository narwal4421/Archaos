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

# cd into api workspace and use npx to resolve local/workspace binaries automatically
RUN cd apps/api && npx prisma generate
RUN cd apps/api && npx nest build

# ── Stage 2: runtime ─────────────────────────────────────────────────────────
FROM node:20-alpine AS runner

RUN apk add --no-cache openssl

WORKDIR /app

# Copy root node_modules and api workspace files to match monorepo layout
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package*.json ./apps/api/
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma
COPY --from=builder /app/package*.json ./

ENV NODE_ENV=production
ENV PORT=5000

EXPOSE 5000

# Migrate, seed, and start using npx to resolve prisma within workspaces
CMD ["sh", "-c", "cd apps/api && npx prisma migrate deploy && npx prisma db seed && node dist/main"]
