/* eslint-disable no-console */
/**
 * Seed banner trang chủ từ banner.json (Cloudinary URL + link nội bộ).
 *
 * Mặc định: **xóa toàn bộ** bản ghi trong `banners` rồi insert lại từ JSON (idempotent theo file).
 * Giữ nguyên: `BANNER_SEED_APPEND=1` → chỉ thêm, không xóa (tránh mất dữ liệu tay).
 *
 * Đường dẫn JSON (ưu tiên):
 *   BANNER_JSON_PATH → prisma/seeds/data/banner.json → backend/banner.json
 *
 * Chạy local:   cd backend && node prisma/seeds/seed_banners.js
 * Docker:       docker compose exec backend node prisma/seeds/seed_banners.js
 */
const path = require('path');
const fs = require('fs');

require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const prisma = require('../../src/utils/prisma');

function resolveBannerJsonPath() {
  const candidates = [
    process.env.BANNER_JSON_PATH,
    path.join(__dirname, 'data/banner.json'),
    path.join(__dirname, '../banner.json'),
    path.join(__dirname, '../../banner.json'),
    path.join(process.cwd(), 'banner.json'),
  ].filter(Boolean);

  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

function normalizeRecord(raw) {
  return {
    title: String(raw.title).trim(),
    subtitle: raw.subtitle != null && String(raw.subtitle).trim() !== '' ? String(raw.subtitle).trim() : null,
    imageUrl: String(raw.imageUrl).trim(),
    linkUrl: String(raw.linkUrl).trim(),
    bgColor: raw.bgColor != null ? String(raw.bgColor).trim() : '#f5f5f7',
    textColor: raw.textColor != null ? String(raw.textColor).trim() : '#1d1d1f',
    isActive: raw.isActive !== false,
    order: raw.order != null ? Number(raw.order) : 0,
    startDate: raw.startDate ? new Date(raw.startDate) : null,
    endDate: raw.endDate ? new Date(raw.endDate) : null,
  };
}

async function main() {
  const jsonPath = resolveBannerJsonPath();
  if (!jsonPath) {
    throw new Error(
      'Không tìm thấy banner.json. Đặt file tại prisma/seeds/data/banner.json hoặc set BANNER_JSON_PATH.'
    );
  }

  const parsed = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  const rows = Array.isArray(parsed) ? parsed : parsed.banners;
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error('banner.json phải là mảng hoặc { "banners": [...] } có ít nhất 1 phần tử.');
  }

  const data = rows.map(normalizeRecord);

  const append = process.env.BANNER_SEED_APPEND === '1' || process.env.BANNER_SEED_APPEND === 'true';
  if (!append) {
    const deleted = await prisma.banner.deleteMany({});
    console.log(`Đã xóa ${deleted.count} banner cũ.`);
  }

  let created = 0;
  for (const row of data) {
    await prisma.banner.create({ data: row });
    created += 1;
  }

  console.log(`Đã seed ${created} banner từ: ${jsonPath}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
