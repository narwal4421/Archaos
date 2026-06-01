# ── Stage 1: build ───────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files and install ALL deps (including devDeps for nest build)
COPY package*.json ./
RUN npm ci

# Copy source
COPY . .

# Generate Prisma client and compile TypeScript → dist/
RUN npx prisma generate
RUN npm run build

# ── Stage 2: runtime ─────────────────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

# Only copy what we need to run
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma

ENV NODE_ENV=production
ENV PORT=5000

EXPOSE 5000

# On container start: run migrations, seed DB, then start the API
CMD ["sh", "-c", "npx prisma migrate deploy && npx prisma db seed && node dist/main"]
