# Single-stage Dockerfile for Railway (compatible with npm workspaces)
FROM node:20-alpine

# Install OpenSSL (required by Prisma on Alpine)
RUN apk add --no-cache openssl

WORKDIR /app

# Install all workspace dependencies (including @prisma/client) and ensure Prisma client is present
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
COPY apps/web/package*.json ./apps/web/

# Install dependencies (including devDependencies) – we set NODE_ENV after install so all deps are installed
RUN npm ci

# Explicitly install @prisma/client to guarantee it exists in the final image (in case it was stripped out)
RUN npm install @prisma/client

# Copy source code
COPY . .

# Generate Prisma client and build NestJS API
RUN cd apps/api && npx prisma generate && npx nest build

# Expose the port used by the Nest app (default 5000 set by Railway)
EXPOSE 5000

# Ensure Prisma binaries are on PATH and set runtime env vars
ENV PATH="/app/node_modules/.bin:/app/apps/api/node_modules/.bin:${PATH}"
ENV NODE_ENV=production
ENV PORT=5000

# Default command – run migrations, seed DB, then start the Nest app
CMD ["sh", "-c", "cd apps/api && prisma migrate deploy && prisma db seed && node dist/main"]
