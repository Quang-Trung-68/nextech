#!/bin/sh
set -e
cd /app

if [ ! -d "node_modules/vite" ]; then
  echo "[docker] Cài đặt npm dependencies frontend (lần đầu)..."
  npm ci
fi

exec "$@"
