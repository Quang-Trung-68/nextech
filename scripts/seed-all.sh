#!/usr/bin/env bash
# NexTech — seed DB: main prisma seed + blog posts from prisma/seeds/data/posts.json
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# Local dev: docker-compose.yml  |  VPS production: COMPOSE_FILE=docker-compose.prod.yml
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.yml}"

echo "🌱 Seeding NexTech (compose: $COMPOSE_FILE)..."

echo "📦 [1/2] prisma db seed (categories, brands, products, users, …)..."
docker compose -f "$COMPOSE_FILE" exec -T backend npx prisma db seed

echo "📰 [2/2] Blog posts (seed_posts.js)..."
docker compose -f "$COMPOSE_FILE" exec -T backend node prisma/seeds/seed_posts.js

echo ""
echo "✅ Seed complete. Tip: docker compose -f \"$COMPOSE_FILE\" exec backend npx prisma studio"
