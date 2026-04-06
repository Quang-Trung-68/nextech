/* eslint-disable no-console */
/**
 * Upsert thương hiệu từ brands.json (logo Clearbit/favicon, link site, thứ tự carousel).
 *
 * - Không xóa brand: chỉ cập nhật/tạo theo slug trong file (an toàn với product.brandId).
 * - Sau khi chạy, ít nhất một brand có carouselOrder → API GET /products/brands?carousel=1
 *   chỉ trả các brand có carouselOrder (theo thứ tự).
 *
 * Đường dẫn JSON (ưu tiên):
 *   BRANDS_JSON_PATH → prisma/seeds/data/brands.json
 *
 * Chạy:   cd backend && node prisma/seeds/seed_brands.js
 * Docker: docker compose exec backend node prisma/seeds/seed_brands.js
 */
const path = require('path');
const fs = require('fs');

require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const prisma = require('../../src/utils/prisma');

function resolveBrandsJsonPath() {
  const candidates = [
    process.env.BRANDS_JSON_PATH,
    path.join(__dirname, 'data/brands.json'),
    path.join(process.cwd(), 'prisma/seeds/data/brands.json'),
  ].filter(Boolean);

  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

function normalizeRecord(raw) {
  const name = String(raw.name).trim();
  const slug = String(raw.slug).trim();
  if (!name || !slug) {
    throw new Error('Mỗi brand cần name và slug hợp lệ.');
  }
  return {
    name,
    slug,
    logo: raw.logo != null && String(raw.logo).trim() !== '' ? String(raw.logo).trim() : null,
    description:
      raw.description != null && String(raw.description).trim() !== ''
        ? String(raw.description).trim()
        : null,
    carouselOrder: raw.carouselOrder != null && raw.carouselOrder !== '' ? Number(raw.carouselOrder) : null,
    websiteUrl:
      raw.websiteUrl != null && String(raw.websiteUrl).trim() !== ''
        ? String(raw.websiteUrl).trim()
        : null,
    carouselCategorySlug:
      raw.carouselCategorySlug != null && String(raw.carouselCategorySlug).trim() !== ''
        ? String(raw.carouselCategorySlug).trim()
        : null,
  };
}

async function main() {
  const jsonPath = resolveBrandsJsonPath();
  if (!jsonPath) {
    throw new Error(
      'Không tìm thấy brands.json. Đặt file tại prisma/seeds/data/brands.json hoặc set BRANDS_JSON_PATH.'
    );
  }

  const parsed = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  const rows = Array.isArray(parsed) ? parsed : parsed.brands;
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error('brands.json phải là mảng hoặc { "brands": [...] } có ít nhất 1 phần tử.');
  }

  const data = rows.map(normalizeRecord);

  let upserted = 0;
  for (const row of data) {
    await prisma.brand.upsert({
      where: { slug: row.slug },
      create: {
        name: row.name,
        slug: row.slug,
        logo: row.logo,
        description: row.description,
        carouselOrder: row.carouselOrder,
        websiteUrl: row.websiteUrl,
        carouselCategorySlug: row.carouselCategorySlug,
      },
      update: {
        name: row.name,
        logo: row.logo,
        description: row.description,
        carouselOrder: row.carouselOrder,
        websiteUrl: row.websiteUrl,
        carouselCategorySlug: row.carouselCategorySlug,
      },
    });
    upserted += 1;
    console.log(`✓ ${row.slug}`);
  }

  console.log(`\nĐã upsert ${upserted} thương hiệu từ: ${jsonPath}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
