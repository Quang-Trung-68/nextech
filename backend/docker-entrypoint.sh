#!/bin/sh
set -e
cd /app

# Volume node_modules trống lần đầu — cài dependency
if [ ! -d "node_modules/@prisma/client" ]; then
  echo "[docker] Cài đặt npm dependencies (lần đầu có thể vài phút)..."
  npm ci
fi

npx prisma generate
echo "[docker] prisma migrate deploy..."
npx prisma migrate deploy

# Seed dữ liệu: chạy thủ công từ host — bash scripts/seed-all.sh (không auto-seed khi start)

# Production image CMD không truyền tham số — mặc định chạy API
if [ "$#" -eq 0 ]; then
  set -- node server.js
fi
exec "$@"
