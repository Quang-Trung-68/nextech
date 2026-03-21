const prisma = require('../src/utils/prisma');

async function main() {
  console.log('Seeding ShopSettings...');
  await prisma.shopSettings.upsert({
    where: { id: 'singleton' },
    update: {},
    create: {
      shopName: 'NexTech',
      shopAddress: '123 Nguyễn Huệ, Quận 1, TP.HCM',
      taxCode: '0123456789',
      phone: '0901234567',
      email: 'contact@nextech.vn',
    },
  });
  console.log('Seeding ShopSettings done.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
