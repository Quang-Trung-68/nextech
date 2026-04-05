# Seed bài viết

## Import từ crawler Sforum (`seed_posts.js`)

Để **upsert** bài từ `posts.json` (ưu tiên đặt tại `prisma/seeds/data/posts.json`) — 5 danh mục Sforum (`tin-cong-nghe`, `tu-van`, …), **idempotent** theo `slug`, xem:

- Script: `prisma/seeds/seed_posts.js`
- Hướng dẫn Docker/local: [`SEED_POSTS_GUIDE.md`](./SEED_POSTS_GUIDE.md)

```bash
cd backend
npm run db:seed:sforum
# hoặc: node prisma/seeds/seed_posts.js
```

---

## Seed bài viết mẫu (`seed_post.js`)

Script **upsert** 2 danh mục cố định (theo slug) và **tạo thêm 20 bài** `PUBLISHED` mỗi lần chạy:

- `Công nghệ & Xu hướng` → `cong-nghe-xu-huong`
- `Hướng dẫn & Tips` → `huong-dan-tips`

Mỗi lần seed có **mã lô** (`runId`) — slug dạng `nex-seed-<runId>-c1-1` … `c2-10` **không trùng** các lần trước. **Không xóa** bài cũ.

Tiêu đề có hậu tố `[<runId>]` để dễ phân biệt trong admin.

**Điều kiện:** đã có ít nhất một user **ADMIN** (thường tạo bằng `npm run db:seed` trong `prisma/seed.js`).

---

## Chạy trên máy (PostgreSQL local / `.env` trỏ đúng DB)

```bash
cd backend
npm run db:seed:posts
```

---

## Chạy khi dùng Docker Compose (DB trong container)

1. Bật stack (từ thư mục gốc repo):

   ```bash
   docker compose up -d
   ```

2. Đợi `postgres` healthy, backend đã chạy.

3. Chạy seed **bên trong container backend**:

   ```bash
   docker compose exec backend node prisma/seed_post.js
   ```

4. `DATABASE_URL` trong container đã trỏ tới service `postgres` (xem `docker-compose.yml`).

---

## Kết nối DB bằng DBeaver / psql (host)

- **Host:** `localhost`
- **Port:** `5433` (map ra từ Postgres trong Docker)
- **Database / User / Password:** theo `POSTGRES_*` trong `.env` cạnh compose (mặc định thường `nextech` / `nextech` / `nextech`).

---

## Dọn bài seed (tùy chọn)

Trong SQL hoặc Prisma Studio, xóa các `posts` có `slug` bắt đầu bằng `nex-seed-` nếu cần thu gọn dữ liệu.
