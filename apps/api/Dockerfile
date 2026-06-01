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

# Copy root node_modules and package files
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

# Copy api workspace files
COPY --from=builder /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=builder /app/apps/api/package*.json ./apps/api/
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma

# Copy seed source and tsconfig to ensure seeding works from root /app directory
COPY --from=builder /app/apps/api/tsconfig.json ./tsconfig.json
COPY --from=builder /app/apps/api/src/prisma/seed.ts ./apps/api/src/prisma/seed.ts

# Copy Nest build output to root `./dist` to support Railway's default start command: `node dist/main`
COPY --from=builder /app/apps/api/dist ./dist

# Put the monorepo node_modules bin folders onto the PATH so binaries like prisma and ts-node are globally resolved by shell
ENV PATH="/app/node_modules/.bin:/app/apps/api/node_modules/.bin:${PATH}"
ENV NODE_ENV=production
ENV PORT=5000

EXPOSE 5000

# Default CMD fallback in case they clear the start command
CMD ["sh", "-c", "prisma migrate deploy && prisma db seed && node dist/main"]
