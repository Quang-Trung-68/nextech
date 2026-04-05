# Deploy NexTech lên VPS (Docker production)

## Yêu cầu

- Docker Engine + Docker Compose plugin (`docker compose`)
- DNS: `nextech.io.vn`, `www.nextech.io.vn`, `api.nextech.io.vn` trỏ A record về IP VPS

## Lần đầu

1. SSH vào VPS, clone repo.
2. Copy env: `cp .env.deploy.template .env` rồi điền **tất cả** giá trị (đặc biệt `POSTGRES_*`, secrets, `VITE_*`, `CERTBOT_EMAIL`).
3. Copy `backend/.env.example` → `backend/.env` và điền secrets (Stripe, Cloudinary, JWT, …).
4. Đặt file crawl (nếu có) vào `backend/prisma/seeds/data/` (`posts.json`, `products.json`) — thư mục này có thể bị `.gitignore`; không commit dữ liệu thô.
5. Lấy SSL (một lần): `bash init-letsencrypt.sh`
6. Build & chạy stack: `bash scripts/deploy.sh`
7. Seed dữ liệu (sau khi stack đã chạy):

   ```bash
   COMPOSE_FILE=docker-compose.prod.yml bash scripts/seed-all.sh
   ```

   Hoặc từ root đã có `export COMPOSE_FILE=docker-compose.prod.yml` trong shell.

## Cập nhật sau này

```bash
git pull && bash scripts/deploy.sh
```

## SSL / Certbot

- Script `init-letsencrypt.sh` dùng **certbot** trong `docker-compose.prod.yml` và thư mục `./certbot/` trên host.
- Container `certbot` chạy vòng lặp `certbot renew` định kỳ; sau renew có thể cần reload Nginx thủ công nếu bạn thêm hook.

## Port

- Chỉ **Nginx** mở **80** và **443**. Backend, frontend (static), Soketi, Postgres chỉ trong mạng Docker `nextech-network`.

## Dev local (không production)

```bash
docker compose up -d
# seed:
bash scripts/seed-all.sh
```

`scripts/seed-all.sh` mặc định dùng `docker-compose.yml` (dev). Trên VPS production luôn set `COMPOSE_FILE=docker-compose.prod.yml`.
