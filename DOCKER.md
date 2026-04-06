# Chạy NexTech bằng Docker

## Production (VPS)

- File compose: **`docker-compose.prod.yml`** — Postgres, Soketi, backend (image production), frontend (build static + Nginx), reverse proxy **Nginx** (80/443), **Certbot** (renew).
- Deploy một lệnh: **`bash scripts/deploy.sh`** (git pull → build → up → `prisma generate` → `prisma migrate deploy`).
- SSL lần đầu: **`bash init-letsencrypt.sh`**, sau đó `bash scripts/deploy.sh`.
- **Seed dữ liệu (sản phẩm từ `products.json` + blog từ `posts.json`):**
  ```bash
  COMPOSE_FILE=docker-compose.prod.yml bash scripts/seed-all.sh
  ```
- **Làm sạch volume Postgres + seed lại (demo — xóa hết DB trong Docker):**
  ```bash
  COMPOSE_FILE=docker-compose.prod.yml FORCE=1 bash scripts/reset-and-seed.sh
  ```
- Chi tiết: **[VPS_DEPLOY_GUIDE.md](./VPS_DEPLOY_GUIDE.md)**
- **CI/CD (GitHub Actions + ghcr.io):** workflow [`.github/workflows/ci-cd.yml`](./.github/workflows/ci-cd.yml) — lint → build & push 3 image (`nextech-backend`, `nextech-soketi`, `nextech-frontend`) → SSH deploy (pull, `up --no-build`, `prisma generate`, `prisma migrate deploy`). Trên VPS, đặt `GHCR_PREFIX` trong `.env` gốc (cùng cấp compose) khớp với `ghcr.io/<github-owner-thường>` và cấu hình Secrets trong repo (xem workflow). Deploy thủ công vẫn dùng `bash scripts/deploy.sh` (build local).
- **Gỡ lỗi SSH deploy (`unable to authenticate` / `no supported methods remain`):** Secret `VPS_SSH_KEY` phải là **toàn bộ private key** (có dòng `-----BEGIN … PRIVATE KEY-----` … `-----END …-----`), không dán nhầm **public key** (`ssh-ed25519` / `ssh-rsa` một dòng). Public key tương ứng phải có trong `~/.ssh/authorized_keys` của đúng user `VPS_USER` trên VPS (`chmod 700 ~/.ssh`, `chmod 600 ~/.ssh/authorized_keys`). Thử từ máy bạn: `ssh -i /path/to/private_key VPS_USER@VPS_HOST`. Private key có **passphrase** thì cần thêm input `passphrase` vào `appleboy/ssh-action` (secret riêng) hoặc dùng key **không passphrase** chỉ cho CI. SSH **cổng khác 22** thì thêm input `port` vào action.

---

## Development (local) — yêu cầu

- Docker Engine + plugin Compose (`docker compose` hoặc `docker-compose`)
- File `backend/.env` và `frontend/.env` (copy từ `.env.example` và điền secret). `DATABASE_URL` trong `backend/.env` **sẽ bị override** bởi `docker-compose.yml` để trỏ tới container `postgres`.

## Chạy

```bash
# Từ thư mục gốc repo
docker compose build --no-cache   # lần đầu hoặc sau khi đổi Dockerfile
docker compose up -d
```

- **Frontend:** http://localhost:5173  
- **API:** http://localhost:3000/api  
- **Soketi (WebSocket):** `ws://localhost:6001` — thông báo realtime; backend gửi event qua host `soketi` trong Compose.

## PostgreSQL — kết nối từ DBeaver / GUI (máy host)

| Trường    | Giá trị (mặc định) |
|----------|---------------------|
| Host     | `localhost`         |
| Port     | `5433` (host → container 5432, xem `docker-compose.yml`) |
| Database | `nextech` (hoặc `POSTGRES_DB` trong `.env` root) |
| User     | `nextech` (hoặc `POSTGRES_USER`) |
| Password | `nextech` (hoặc `POSTGRES_PASSWORD`) |

Có thể tạo file `.env` ở **root** repo (cạnh `docker-compose.yml`) — xem `.env.docker.example`. Compose dùng các biến `POSTGRES_*` cho service `postgres` và cho chuỗi `DATABASE_URL` của backend.

**Lưu ý:** Trong mạng Docker, backend dùng hostname `postgres`; từ **máy host** kết nối GUI qua `localhost` và **port đã map** (mặc định `5433`).

## Migrate & seed

- Mỗi lần container backend khởi động: **`prisma migrate deploy`**. **Không** tự động chạy seed khi start — seed chạy **thủ công** bằng **`bash scripts/seed-all.sh`** (từ thư mục gốc repo).
- **`seed-all.sh`** gọi lần lượt:
  1. `npm run db:seed` trong container → **`prisma/seed_products.js`** (TRUNCATE toàn bộ bảng liên quan + nạp `prisma/seeds/data/products.json`).
  2. `npm run db:seed:blog` → **`prisma/seeds/seed_posts.js`** (bài viết từ `posts.json`).
- **Chỉ thử nhanh 80 SP demo (ảnh picsum):** trong container `npm run db:seed:demo` — không dùng trong luồng production thông thường.
- **DB sạch hoàn toàn (xóa volume Postgres):** `docker compose down -v` rồi `up -d`, hoặc dùng **`bash scripts/reset-and-seed.sh`** (có hỏi xác nhận, trừ khi `FORCE=1`).

## Soketi / Pusher (WebSocket)

- Trong Compose, **`VITE_SOKETI_ENABLED=false`** mặc định (tránh lỗi console khi Soketi không phản hồi).
- **Bật realtime** (sau khi container `soketi` chạy ổn): trong `frontend/.env` đặt `VITE_SOKETI_ENABLED=true`, rồi `docker compose up -d --force-recreate frontend`.

## Biến môi trường frontend trong Docker

- `VITE_API_URL=http://localhost:3000/api` — trình duyệt trên máy bạn gọi API qua cổng host `3000`.
- `DOCKER=true` — Vite proxy `/api` tới `http://backend:3000` (trong container).

## Xử lý sự cố

- **Lần đầu chậm:** entrypoint có thể chạy `npm ci` nếu volume `node_modules` trống.
- **Đổi `POSTGRES_USER` / `POSTGRES_DB`:** cập nhật cả file `.env` root (Compose) và đảm bảo `healthcheck` của `postgres` vẫn khớp (xem `docker-compose.yml`).
