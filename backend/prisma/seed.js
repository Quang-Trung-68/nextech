/* eslint-disable no-console */
/**
 * Seed demo: 25 sản phẩm có biến thể (4 danh mục).
 * Chạy: npx prisma db seed  (từ thư mục backend)
 */
const bcrypt = require('bcryptjs');
const prisma = require('../src/utils/prisma');
const { getCategoryCode, generateSku } = require('../src/utils/sku');

const randStock = () => 5 + Math.floor(Math.random() * 26);

function cartesian(arrays) {
  return arrays.reduce((acc, curr) => {
    if (!acc.length) return curr.map((x) => [x]);
    return acc.flatMap((a) => curr.map((c) => [...a, c]));
  }, []);
}

async function allocateSku(tx, categoryCode, productId) {
  for (let i = 1; i < 100000; i += 1) {
    const sku = generateSku(categoryCode, productId, i);
    const taken = await tx.productVariant.findUnique({ where: { sku } });
    if (!taken) return sku;
  }
  throw new Error('Cannot allocate SKU');
}

/**
 * @param {import('@prisma/client').PrismaClient} tx
 */
async function createProductWithVariants(tx, def) {
  const categoryCode = getCategoryCode(def.category);
  const slug = def.name.replace(/[^a-zA-Z0-9]/g, '').slice(0, 20) || 'p';

  const product = await tx.product.create({
    data: {
      name: def.name,
      description: def.description,
      price: def.basePrice,
      stock: 0,
      category: def.category,
      brand: def.brand,
      manufactureYear: def.manufactureYear ?? 2024,
      hasVariants: true,
      isNewArrival: true,
      isBestseller: false,
      images: {
        create: [
          {
            url: `https://picsum.photos/seed/${slug}/800/600`,
            publicId: `seed-${slug}`,
          },
        ],
      },
    },
  });

  const attrRows = [];
  for (let ai = 0; ai < def.attributes.length; ai += 1) {
    const attr = def.attributes[ai];
    const row = await tx.productAttribute.create({
      data: {
        productId: product.id,
        name: attr.name,
        position: ai,
        values: {
          create: attr.values.map((v, vi) => ({
            value: v,
            position: vi,
          })),
        },
      },
      include: { values: { orderBy: { position: 'asc' } } },
    });
    attrRows.push(row.values.map((v) => v.id));
  }

  const combos = cartesian(attrRows);
  for (const valueIds of combos) {
    const sku = await allocateSku(tx, categoryCode, product.id);
    const priceOffset = 0.01 * Math.floor(Math.random() * 50);
    await tx.productVariant.create({
      data: {
        productId: product.id,
        sku,
        price: def.basePrice + priceOffset,
        stock: randStock(),
        imageUrl: null,
        values: {
          create: valueIds.map((attributeValueId) => ({ attributeValueId })),
        },
      },
    });
  }

  return product.id;
}

const PRODUCTS = [
  // Điện thoại
  {
    name: 'iPhone 15 Pro Max',
    description: 'Điện thoại flagship Apple chip A17 Pro, khung titan, camera 48MP.',
    category: 'Điện thoại',
    brand: 'Apple',
    basePrice: 29_990_000,
    manufactureYear: 2024,
    attributes: [
      { name: 'Màu', values: ['Titan Tự Nhiên', 'Titan Xanh', 'Titan Trắng'] },
      { name: 'Dung lượng', values: ['256GB', '512GB', '1TB'] },
    ],
  },
  {
    name: 'Samsung Galaxy S24 Ultra',
    description: 'Flagship Android màn hình 6.8", bút S Pen, AI Galaxy.',
    category: 'Điện thoại',
    brand: 'Samsung',
    basePrice: 28_990_000,
    attributes: [
      { name: 'Màu', values: ['Titan Đen', 'Titan Xám', 'Titan Tím'] },
      { name: 'Dung lượng', values: ['256GB', '512GB'] },
    ],
  },
  {
    name: 'Google Pixel 8 Pro',
    description: 'Camera AI Tensor G3, Android thuần Google.',
    category: 'Điện thoại',
    brand: 'Google',
    basePrice: 22_990_000,
    attributes: [
      { name: 'Màu', values: ['Obsidian', 'Bay', 'Porcelain'] },
      { name: 'Dung lượng', values: ['128GB', '256GB'] },
    ],
  },
  {
    name: 'Xiaomi 14 Ultra',
    description: 'Camera Leica, Snapdragon 8 Gen 3.',
    category: 'Điện thoại',
    brand: 'Xiaomi',
    basePrice: 24_990_000,
    attributes: [
      { name: 'Màu', values: ['Đen', 'Trắng'] },
      { name: 'Dung lượng', values: ['256GB', '512GB'] },
    ],
  },
  {
    name: 'OPPO Find X7 Pro',
    description: 'Camera Hasselblad, sạc nhanh SUPERVOOC.',
    category: 'Điện thoại',
    brand: 'OPPO',
    basePrice: 21_990_000,
    attributes: [
      { name: 'Màu', values: ['Đen', 'Xanh biển'] },
      { name: 'Dung lượng', values: ['256GB', '512GB'] },
    ],
  },
  // Laptop
  {
    name: 'MacBook Pro 14" M3 Pro',
    description: 'Laptop Apple chip M3 Pro, màn Liquid Retina XDR.',
    category: 'Laptop',
    brand: 'Apple',
    basePrice: 52_990_000,
    attributes: [
      { name: 'Chip', values: ['M3 Pro', 'M3 Max'] },
      { name: 'RAM', values: ['18GB', '36GB'] },
      { name: 'SSD', values: ['512GB', '1TB'] },
    ],
  },
  {
    name: 'Dell XPS 15',
    description: 'Ultrabook Dell OLED, Intel Core Ultra.',
    category: 'Laptop',
    brand: 'Dell',
    basePrice: 42_990_000,
    attributes: [
      { name: 'RAM', values: ['16GB', '32GB'] },
      { name: 'SSD', values: ['512GB', '1TB'] },
    ],
  },
  {
    name: 'ASUS ROG Zephyrus G14',
    description: 'Gaming laptop AMD Ryzen, GPU RTX.',
    category: 'Laptop',
    brand: 'ASUS',
    basePrice: 38_990_000,
    attributes: [
      { name: 'Màu', values: ['Eclipse Gray', 'Platinum White'] },
      { name: 'RAM', values: ['16GB', '32GB'] },
    ],
  },
  {
    name: 'Lenovo ThinkPad X1 Carbon',
    description: 'Doanh nhân siêu nhẹ, bàn phím ThinkPad.',
    category: 'Laptop',
    brand: 'Lenovo',
    basePrice: 44_990_000,
    attributes: [
      { name: 'RAM', values: ['16GB', '32GB'] },
      { name: 'SSD', values: ['512GB', '1TB'] },
    ],
  },
  {
    name: 'HP Spectre x360 14',
    description: '2-in-1 OLED cảm ứng, xoay 360°.',
    category: 'Laptop',
    brand: 'HP',
    basePrice: 36_990_000,
    attributes: [
      { name: 'Màu', values: ['Nightfall Black', 'Nocturne Blue'] },
      { name: 'SSD', values: ['512GB', '1TB'] },
    ],
  },
  // Máy tính bảng
  {
    name: 'iPad Pro 13" M4',
    description: 'Máy tính bảng Apple chip M4, màn OLED.',
    category: 'Máy tính bảng',
    brand: 'Apple',
    basePrice: 32_990_000,
    attributes: [
      { name: 'Kết nối', values: ['WiFi', 'WiFi + Cellular'] },
      { name: 'Dung lượng', values: ['256GB', '512GB', '1TB'] },
    ],
  },
  {
    name: 'Samsung Galaxy Tab S9 Ultra',
    description: 'Tablet flagship AMOLED 14.6", S Pen.',
    category: 'Máy tính bảng',
    brand: 'Samsung',
    basePrice: 24_990_000,
    attributes: [
      { name: 'Màu', values: ['Graphite', 'Beige'] },
      { name: 'Dung lượng', values: ['256GB', '512GB'] },
    ],
  },
  {
    name: 'iPad Air M2',
    description: 'iPad Air chip M2, nhiều màu.',
    category: 'Máy tính bảng',
    brand: 'Apple',
    basePrice: 16_990_000,
    attributes: [
      { name: 'Màu', values: ['Xanh dương', 'Tím', 'Ánh sao', 'Hồng'] },
      { name: 'Dung lượng', values: ['128GB', '256GB'] },
    ],
  },
  {
    name: 'Lenovo Tab P12 Pro',
    description: 'Tablet Android màn 12.7", Snapdragon.',
    category: 'Máy tính bảng',
    brand: 'Lenovo',
    basePrice: 12_990_000,
    attributes: [{ name: 'Dung lượng', values: ['128GB', '256GB'] }],
  },
  {
    name: 'Microsoft Surface Pro 10',
    description: 'Tablet Windows, chip Intel Core Ultra.',
    category: 'Máy tính bảng',
    brand: 'Microsoft',
    basePrice: 28_990_000,
    attributes: [
      { name: 'RAM', values: ['16GB', '32GB'] },
      { name: 'SSD', values: ['256GB', '512GB'] },
    ],
  },
  // Phụ kiện (tai nghe + phụ kiện)
  {
    name: 'Sony WH-1000XM5',
    description: 'Tai nghe chống ồn chủ động cao cấp.',
    category: 'Phụ kiện',
    brand: 'Sony',
    basePrice: 8_990_000,
    attributes: [{ name: 'Màu', values: ['Đen', 'Bạc', 'Xanh midnight'] }],
  },
  {
    name: 'Apple AirPods Pro 2nd Gen',
    description: 'Tai nghe true wireless ANC, MagSafe.',
    category: 'Phụ kiện',
    brand: 'Apple',
    basePrice: 6_490_000,
    attributes: [{ name: 'Hộp sạc', values: ['MagSafe', 'USB-C'] }],
  },
  {
    name: 'Bose QuietComfort 45',
    description: 'Over-ear thoải mái, âm thanh cân bằng.',
    category: 'Phụ kiện',
    brand: 'Bose',
    basePrice: 7_990_000,
    attributes: [{ name: 'Màu', values: ['Đen', 'Trắng/Bạc'] }],
  },
  {
    name: 'Samsung Galaxy Buds3 Pro',
    description: 'True wireless Galaxy AI, chống nước IP57.',
    category: 'Phụ kiện',
    brand: 'Samsung',
    basePrice: 4_990_000,
    attributes: [{ name: 'Màu', values: ['Trắng', 'Đen', 'Bạc'] }],
  },
  {
    name: 'Jabra Evolve2 85',
    description: 'Tai nghe họp trực tuyến chống ồn.',
    category: 'Phụ kiện',
    brand: 'Jabra',
    basePrice: 9_990_000,
    attributes: [
      { name: 'Kết nối', values: ['USB-A', 'USB-C'] },
      { name: 'Màu', values: ['Đen', 'Xám titan'] },
    ],
  },
  {
    name: 'Apple MagSafe Charger',
    description: 'Sạc không dây MagSafe cho iPhone.',
    category: 'Phụ kiện',
    brand: 'Apple',
    basePrice: 1_290_000,
    attributes: [{ name: 'Chiều dài cáp', values: ['1m', '2m'] }],
  },
  {
    name: 'Logitech MX Master 3S',
    description: 'Chuột không dây đa thiết bị, silent click.',
    category: 'Phụ kiện',
    brand: 'Logitech',
    basePrice: 2_490_000,
    attributes: [{ name: 'Màu', values: ['Graphite', 'Pale Grey', 'Midnight Teal'] }],
  },
  {
    name: 'Keychron K2 Pro',
    description: 'Bàn phím cơ không dây, hot-swap.',
    category: 'Phụ kiện',
    brand: 'Keychron',
    basePrice: 3_290_000,
    attributes: [
      { name: 'Layout', values: ['TKL 75%', 'Full'] },
      { name: 'Switch', values: ['Brown', 'Red', 'Blue'] },
    ],
  },
  {
    name: 'Anker PowerBank 26800mAh',
    description: 'Pin dự phòng sạc nhanh đa cổng.',
    category: 'Phụ kiện',
    brand: 'Anker',
    basePrice: 1_590_000,
    attributes: [{ name: 'Cổng sạc', values: ['USB-A', 'USB-C PD'] }],
  },
  {
    name: 'Belkin Thunderbolt 4 Hub',
    description: 'Hub Thunderbolt 4 đa cổng cho Mac/PC.',
    category: 'Phụ kiện',
    brand: 'Belkin',
    basePrice: 3_990_000,
    attributes: [{ name: 'Phiên bản', values: ['3 cổng', '5 cổng'] }],
  },
];

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@nextech.local';
  const adminPass = process.env.SEED_ADMIN_PASSWORD || 'Admin123!';

  const hash = await bcrypt.hash(adminPass, 10);
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { role: 'ADMIN', password: hash, isEmailVerified: true },
    create: {
      email: adminEmail,
      name: 'Admin Demo',
      password: hash,
      role: 'ADMIN',
      isEmailVerified: true,
    },
  });
  console.log(`Admin: ${adminEmail} / ${adminPass}`);

  let totalVariants = 0;
  await prisma.$transaction(async (tx) => {
    for (const def of PRODUCTS) {
      const id = await createProductWithVariants(tx, def);
      const vc = await tx.productVariant.count({ where: { productId: id } });
      totalVariants += vc;
      console.log(`  + ${def.name} (${vc} variants)`);
    }
  });

  console.log(`Done. ${PRODUCTS.length} products, ${totalVariants} variants total.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
