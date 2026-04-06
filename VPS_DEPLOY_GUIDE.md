# Deploy NexTech lên VPS (Docker production)

## Yêu cầu

- Docker Engine + Docker Compose plugin (`docker compose`)
- DNS: `nextech.io.vn`, `www.nextech.io.vn`, `api.nextech.io.vn` trỏ A record về IP VPS

## Lần đầu

1. SSH vào VPS, clone repo.
2. Copy env: `cp .env.deploy.template .env` rồi điền **tất cả** giá trị (đặc biệt `POSTGRES_*`, secrets, `VITE_*`, `CERTBOT_EMAIL`).
3. Copy `backend/.env.example` → `backend/.env` và điền secrets (Stripe, Cloudinary, JWT, …).
4. Đặt `posts.json` và `products.json` vào `backend/prisma/seeds/data/` (file có thể không nằm trong git — copy thủ công hoặc `scp` lên VPS).
5. SSL (một lần): `bash init-letsencrypt.sh`
6. Build & chạy stack: `bash scripts/deploy.sh`
7. **Seed dữ liệu** (bắt buộc sau deploy — không tự chạy khi container start):

   ```bash
   COMPOSE_FILE=docker-compose.prod.yml bash scripts/seed-all.sh
   ```

   Lệnh này: **xóa sạch dữ liệu cũ trong DB** (TRUNCATE) rồi nạp `products.json` + blog `posts.json` — không tạo duplicate khi chạy lại.

## Pull code mới rồi làm sạch hoàn toàn DB Docker + seed lại

Khi cần xóa cả volume Postgres (ví dụ đổi migration, DB lỗi):

```bash
git pull
COMPOSE_FILE=docker-compose.prod.yml FORCE=1 bash scripts/reset-and-seed.sh
```

(`FORCE=1` bỏ câu hỏi xác nhận.)

## Cập nhật code (không xóa DB)

```bash
git pull && bash scripts/deploy.sh
```

Nếu chỉ cần **chạy lại seed** (TRUNCATE + nạp lại JSON): `COMPOSE_FILE=docker-compose.prod.yml bash scripts/seed-all.sh`

## SSL / Certbot

- Script `init-letsencrypt.sh` dùng **certbot** trong `docker-compose.prod.yml` và thư mục `./certbot/` trên host.
- Container `certbot` chạy vòng lặp `certbot renew` định kỳ; sau renew có thể cần reload Nginx thủ công nếu bạn thêm hook.

## Port

- Chỉ **Nginx** mở **80** và **443**. Backend, frontend (static), Soketi, Postgres chỉ trong mạng Docker `nextech-network`.

## Dev local

```bash
docker compose up -d
bash scripts/seed-all.sh
```

Trên VPS production luôn set `COMPOSE_FILE=docker-compose.prod.yml` cho các lệnh trên.

---

## SePay (demo / test trên VPS)

**Triệu chứng:** thanh toán SePay chạy trên localhost nhưng không chạy trên production.

**Nguyên nhân thường gặp**

1. **Sandbox vs production:** Backend dùng SDK SePay với `env: sandbox` hoặc `production`. Key test (`SP-TEST-...`, `spsk_test_...`) chỉ hợp lệ với **sandbox**. Trước đây `NODE_ENV=production` trên VPS khiến SDK gọi nhầm **production** → lỗi. Code hiện **tự nhận diện key test**; có thể ép bằng `SEPAY_ENV=sandbox` trong `backend/.env`.
2. **`FRONTEND_URL` / `CLIENT_URL`:** `success_url` của SePay lấy từ `FRONTEND_URL` (ví dụ `https://nextech.io.vn`). Phải đúng domain frontend (HTTPS), không để `http://localhost:5173` trên VPS.
3. **Webhook IPN:** SePay gọi `POST https://api.<domain>/api/payments/sepay/webhook`. Domain API phải public, HTTPS ổn định, Nginx proxy tới backend. Kiểm tra nhanh (từ máy bất kỳ):

   ```bash
   curl -sS -o /dev/null -w "%{http_code}\n" -X POST https://api.nextech.io.vn/api/payments/sepay/webhook \
     -H "Content-Type: application/json" -d '{}'
   ```

   (Có thể trả 500 do body rỗng — quan trọng là không 404/502.)

4. **Debug:** Trong `backend/.env` tạm thời thêm `SEPAY_DEBUG=1`, restart backend, xem log `[SePay] SDK env=sandbox|production` khi có request tạo checkout.

5. **CORS:** Checkout mở trang SePay (POST form); sau redirect về `FRONTEND_URL`. Nếu chỉ lỗi sau khi về trang đơn hàng, xem Network tab request `POST /api/payments/sepay/sync/:orderId` (cookie JWT / 401).
