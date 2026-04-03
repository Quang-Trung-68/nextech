/* eslint-disable no-console */
/**
 * Chạy seed chỉ khi DB trống (không có Product), tránh nhân đôi dữ liệu mỗi lần restart.
 * Để ép seed lại: SEED_FORCE=true
 * Để tắt hẳn: SEED_ON_START=false
 */
const path = require('path');
require('dotenv').config();
const { execSync } = require('child_process');
const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

async function main() {
  if (process.env.SEED_ON_START === 'false') {
    console.log('[docker-seed] SEED_ON_START=false — bỏ qua seed.');
    return;
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

  try {
    const count = await prisma.product.count();
    if (count > 0 && process.env.SEED_FORCE !== 'true') {
      console.log('[docker-seed] Đã có sản phẩm trong DB — bỏ qua seed. (SEED_FORCE=true để chạy lại)');
      return;
    }
    console.log('[docker-seed] Chạy prisma db seed...');
    const appRoot = process.env.DOCKER_APP_ROOT || path.join(__dirname, '..');
    execSync('npx prisma db seed', { stdio: 'inherit', cwd: appRoot, env: process.env });
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
