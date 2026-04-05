#!/usr/bin/env bash
# NexTech — seed đầy đủ (một luồng duy nhất):
#   1) seed_products.js — TRUNCATE toàn bộ bảng + shop/users/brands/sản phẩm từ prisma/seeds/data/products.json
#   2) seed_posts.js — bài viết từ prisma/seeds/data/posts.json
#
# Không chạy prisma/seed.js (demo 80 SP ảnh picsum) — dùng db:seed:demo nếu cần thử nhanh.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.yml}"

echo "🌱 NexTech seed-all (compose: $COMPOSE_FILE)"
echo ""

echo "📦 [1/2] Sản phẩm + shop + users (TRUNCATE + products.json)..."
# Gọi node trực tiếp — không phụ thuộc npm script (image cũ có thể thiếu db:seed trong package.json)
docker compose -f "$COMPOSE_FILE" exec -T backend node prisma/seed_products.js

echo ""
echo "📰 [2/2] Bài viết blog (posts.json)..."
docker compose -f "$COMPOSE_FILE" exec -T backend node prisma/seeds/seed_posts.js

echo ""
echo "✅ Hoàn tất. Kiểm tra: docker compose -f \"$COMPOSE_FILE\" exec backend npx prisma studio"
