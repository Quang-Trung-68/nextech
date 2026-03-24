// backend/scripts/sync-product-ratings.js
// Chạy một lần để reset data fake và sync lại rating/numReviews từ Review thực tế.
//
//   cd backend
//   node scripts/sync-product-ratings.js

// Load .env trước khi khởi tạo bất kỳ module nào dùng process.env
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// Dùng singleton prisma (đã cấu hình adapter pg) thay vì tạo PrismaClient mới
const prisma = require('../src/utils/prisma');

// Import trực tiếp helper, không qua barrel index
const recalculateProductRating = require('../src/utils/recalculateProductRating');

async function main() {
  const products = await prisma.product.findMany({ select: { id: true } });
  console.log(`Found ${products.length} products. Syncing ratings...`);

  await Promise.all(products.map((p) => recalculateProductRating(p.id)));

  console.log(`✅ Synced ratings for ${products.length} products.`);
}

main()
  .catch((e) => {
    console.error('❌ Sync failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
