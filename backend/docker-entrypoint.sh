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

echo "[docker] Kiểm tra seed..."
# Seed lỗi không được chặn khởi động server (set -e sẽ dừng cả container)
set +e
node scripts/docker-seed.js
SEED_EXIT=$?
set -e
if [ "$SEED_EXIT" -ne 0 ]; then
  echo "[docker] Cảnh báo: seed thoát mã $SEED_EXIT — API vẫn chạy. Chạy lại: docker compose exec backend npx prisma db seed"
fi

# Production image CMD không truyền tham số — mặc định chạy API
if [ "$#" -eq 0 ]; then
  set -- node server.js
fi
exec "$@"
