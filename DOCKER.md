# Chạy NexTech bằng Docker (dev)

## Yêu cầu

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

- Mỗi lần container backend khởi động: `prisma migrate deploy`, sau đó seed **chỉ khi** bảng `Product` còn trống (tránh nhân đôi dữ liệu khi `docker compose restart`).
- Nếu seed lỗi khi start, backend **vẫn chạy** (xem log `[docker] Cảnh báo: seed...`). Chạy tay:
  ```bash
  docker compose exec backend npx prisma db seed
  ```
- **Ép chạy lại seed:** đặt `SEED_FORCE=true` trong `backend/.env` (và xóa dữ liệu cũ nếu cần).
- **Tắt seed:** `SEED_ON_START=false` trong `backend/.env`.
- **DB sạch hoàn toàn:** `docker compose down -v` (xóa volume `postgres_data`).

## Soketi / Pusher (WebSocket)

- Trong Compose, **`VITE_SOKETI_ENABLED=false`** mặc định (tránh lỗi console khi Soketi không phản hồi).
- **Bật realtime** (sau khi container `soketi` chạy ổn): trong `frontend/.env` đặt `VITE_SOKETI_ENABLED=true`, rồi `docker compose up -d --force-recreate frontend`.

## Biến môi trường frontend trong Docker

- `VITE_API_URL=http://localhost:3000/api` — trình duyệt trên máy bạn gọi API qua cổng host `3000`.
- `DOCKER=true` — Vite proxy `/api` tới `http://backend:3000` (trong container).

## Xử lý sự cố

- **Lần đầu chậm:** entrypoint có thể chạy `npm ci` nếu volume `node_modules` trống.
- **Đổi `POSTGRES_USER` / `POSTGRES_DB`:** cập nhật cả file `.env` root (Compose) và đảm bảo `healthcheck` của `postgres` vẫn khớp (xem `docker-compose.yml`).
