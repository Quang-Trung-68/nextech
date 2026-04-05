#!/usr/bin/env bash
# Xóa volume Postgres (toàn bộ dữ liệu DB trong Docker) + khởi động lại stack + seed-all.
# Dùng khi muốn làm sạch hoàn toàn (demo / dev). Trên VPS: export COMPOSE_FILE=docker-compose.prod.yml
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.yml}"

echo "⚠️  Sẽ: docker compose down -v (xóa postgres_data) rồi up -d, sau đó seed-all."
if [ "${FORCE:-}" != "1" ]; then
  read -r -p "Tiếp tục? [y/N] " reply
  case "$reply" in
    [yY]*) ;;
    *) echo "Hủy. (Chạy lại với FORCE=1 để bỏ hỏi.)"; exit 1 ;;
  esac
fi

echo "🛑 Stopping và xóa volumes..."
docker compose -f "$COMPOSE_FILE" down -v

echo "🚀 Khởi động stack..."
docker compose -f "$COMPOSE_FILE" up -d

echo "⏳ Chờ PostgreSQL..."
until docker compose -f "$COMPOSE_FILE" exec -T postgres pg_isready -U "${POSTGRES_USER:-nextech}" >/dev/null 2>&1; do
  sleep 2
done

echo "⏳ Chờ backend (migrate + healthy)..."
for _ in $(seq 1 60); do
  if docker compose -f "$COMPOSE_FILE" exec -T backend node -e \
    "require('http').get('http://127.0.0.1:3000/health',(r)=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))" \
    2>/dev/null; then
    break
  fi
  sleep 3
done

export COMPOSE_FILE
exec "$ROOT/scripts/seed-all.sh"
