# Hướng dẫn chạy `seed_posts.js` (blog từ `posts.json`)

Script: **`prisma/seeds/seed_posts.js`**

## Đường dẫn file `posts.json`

Thứ tự ưu tiên:

1. Biến môi trường **`POSTS_JSON_PATH`** (đường dẫn tuyệt đối trong container hoặc host).
2. **`prisma/seeds/data/posts.json`** (khuyến nghị — đặt file tại đây).
3. `backend/posts.json`, thư mục gốc repo, hoặc `posts.json` trong cwd.

Trong Docker production, mount thư mục `./backend/prisma/seeds/data` → `/app/prisma/seeds/data` (xem `docker-compose.prod.yml`).

## Chạy

**Local (từ thư mục `backend`):**

```bash
npm run db:seed:blog
# hoặc
node prisma/seeds/seed_posts.js
```

**Docker Compose (dev — file compose mặc định):**

```bash
docker compose exec backend node prisma/seeds/seed_posts.js
```

**Một lệnh seed đầy đủ (main seed + posts):**

```bash
bash scripts/seed-all.sh
```

Trên VPS với `docker-compose.prod.yml`:

```bash
COMPOSE_FILE=docker-compose.prod.yml bash scripts/seed-all.sh
```

## Điều kiện

- Đã chạy migrate và có user **ADMIN** (sau `npm run db:seed` / `bash scripts/seed-all.sh`).
- Script **xóa toàn bộ Post + Tag** rồi import lại từ JSON.
