# ================================
# Stage 1: Builder
# ================================
FROM node:20-alpine AS builder

WORKDIR /app

# Install ALL dependencies (including devDeps like prisma CLI)
COPY package*.json ./
RUN npm ci

# Copy source code and Prisma schema
COPY . .

# Generate Prisma client (requires prisma CLI from devDeps)
RUN npx prisma generate

# Remove dev dependencies, keep only production
RUN npm prune --production

# ================================
# Stage 2: Runner
# ================================
FROM node:20-alpine AS runner

WORKDIR /app

# Copy the pruned app from builder
COPY --from=builder /app ./

# Copy and set up entrypoint
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["./docker-entrypoint.sh"]
