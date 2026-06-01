# ── Stage 1: build ───────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

# Install openssl for Prisma CLI engine compatibility on Alpine
RUN apk add --no-cache openssl

WORKDIR /app

# Copy root workspace configurations and package files
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
COPY apps/web/package*.json ./apps/web/

# Install dependencies for the whole monorepo
RUN npm ci

# Copy the rest of the source code
COPY . .

# Generate Prisma client and compile the API using npx
RUN npx prisma generate --schema=apps/api/prisma/schema.prisma
RUN npm run build:api

# ── Stage 2: runtime ─────────────────────────────────────────────────────────
FROM node:20-alpine AS runner

# Install openssl for Prisma engine at runtime on Alpine
RUN apk add --no-cache openssl

WORKDIR /app

# Copy built code and dependencies
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package*.json ./apps/api/
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma
COPY --from=builder /app/package*.json ./

ENV NODE_ENV=production
ENV PORT=5000

EXPOSE 5000

# Run migrations, seed, and start using npx
CMD ["sh", "-c", "npx prisma migrate deploy --schema=apps/api/prisma/schema.prisma && npx prisma db seed --schema=apps/api/prisma/schema.prisma && node apps/api/dist/main"]
