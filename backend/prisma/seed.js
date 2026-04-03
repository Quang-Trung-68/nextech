/* eslint-disable no-console */
/**
 * Seed: ShopSettings, 5 brands, 80 products (variants + serials), users, orders, reviews, invoice.
 * Chạy: npx prisma db seed  (từ thư mục backend)
 */
const bcrypt = require('bcryptjs');
const prisma = require('../src/utils/prisma');
const { getCategoryCode, generateSku } = require('../src/utils/sku');
const { generateUniqueProductSlug } = require('../src/utils/productSlugify');
const { createDraftInvoice, issueInvoice } = require('../src/services/invoice.service');

const randInt = (min, max) => min + Math.floor(Math.random() * (max - min + 1));

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

const BRANDS_DATA = [
  { name: 'Apple', slug: 'apple', description: 'Thương hiệu Apple' },
  { name: 'Samsung', slug: 'samsung', description: 'Thương hiệu Samsung' },
  { name: 'Xiaomi', slug: 'xiaomi', description: 'Thương hiệu Xiaomi' },
  { name: 'OPPO', slug: 'oppo', description: 'Thương hiệu OPPO' },
  { name: 'Asus', slug: 'asus', description: 'Thương hiệu Asus' },
];

/** @type {Array<[string, string, number]>} [brandSlug, name, basePrice] */
const PHONE_DEFS = [
  ['apple', 'iPhone 16 Pro Max', 36_990_000],
  ['apple', 'iPhone 16', 29_990_000],
  ['apple', 'iPhone 15 Pro', 27_990_000],
  ['apple', 'iPhone 14', 19_990_000],
  ['samsung', 'Galaxy S25 Ultra', 33_990_000],
  ['samsung', 'Galaxy S25+', 28_990_000],
  ['samsung', 'Galaxy A55', 10_990_000],
  ['samsung', 'Galaxy A35', 8_990_000],
  ['xiaomi', 'Xiaomi 14 Ultra', 31_990_000],
  ['xiaomi', 'Xiaomi 14T Pro', 14_990_000],
  ['xiaomi', 'Redmi Note 13 Pro+', 9_990_000],
  ['xiaomi', 'Redmi 13C', 3_990_000],
  ['oppo', 'OPPO Find X8 Pro', 26_990_000],
  ['oppo', 'OPPO Reno 12 Pro', 15_990_000],
  ['oppo', 'OPPO A3 Pro', 7_990_000],
  ['oppo', 'OPPO A98', 8_490_000],
  ['asus', 'ROG Phone 9 Pro', 32_990_000],
  ['asus', 'ROG Phone 8 Pro', 24_990_000],
  ['asus', 'Zenfone 11 Ultra', 18_990_000],
  ['asus', 'Zenfone 10', 12_990_000],
];

const TABLET_DEFS = [
  ['apple', 'iPad Pro 13" M4', 35_990_000],
  ['apple', 'iPad Pro 11" M4', 28_990_000],
  ['apple', 'iPad Air M2', 16_990_000],
  ['apple', 'iPad mini 7', 14_990_000],
  ['samsung', 'Galaxy Tab S9 Ultra', 29_990_000],
  ['samsung', 'Galaxy Tab S9+', 24_990_000],
  ['samsung', 'Galaxy Tab S9 FE', 12_990_000],
  ['samsung', 'Galaxy Tab A9+', 7_990_000],
  ['xiaomi', 'Xiaomi Pad 7 Pro', 13_990_000],
  ['xiaomi', 'Xiaomi Pad 7', 10_990_000],
  ['xiaomi', 'Xiaomi Pad 6S Pro', 15_990_000],
  ['xiaomi', 'Redmi Pad Pro', 8_990_000],
  ['oppo', 'OPPO Pad 3 Pro', 17_990_000],
  ['oppo', 'OPPO Pad 3', 12_490_000],
  ['oppo', 'OPPO Pad Air2', 8_490_000],
  ['oppo', 'OPPO Pad Neo', 6_990_000],
  ['asus', 'ROG Flow Z13 2024', 45_990_000],
  ['asus', 'Asus Zenpad 10 Plus', 9_990_000],
  ['asus', 'Asus Zenpad 8', 6_490_000],
  ['asus', 'Asus Vivobook 13 Slate', 16_990_000],
];

const LAPTOP_DEFS = [
  ['apple', 'MacBook Pro 16" M4 Max', 92_990_000],
  ['apple', 'MacBook Pro 14" M4', 58_990_000],
  ['apple', 'MacBook Air 15" M3', 38_990_000],
  ['apple', 'MacBook Air 13" M3', 28_990_000],
  ['samsung', 'Galaxy Book4 Ultra', 52_990_000],
  ['samsung', 'Galaxy Book4 Pro 360', 44_990_000],
  ['samsung', 'Galaxy Book4 Pro', 36_990_000],
  ['samsung', 'Galaxy Book4 Edge', 41_990_000],
  ['xiaomi', 'Xiaomi Book Pro 16 2024', 32_990_000],
  ['xiaomi', 'Xiaomi Book Pro 14 2024', 27_990_000],
  ['xiaomi', 'Xiaomi Book Air 13', 22_990_000],
  ['xiaomi', 'Xiaomi Book S 12', 18_990_000],
  ['oppo', 'OPPO Laptop Pro 16', 34_990_000],
  ['oppo', 'OPPO Laptop Pro 14', 29_990_000],
  ['oppo', 'OPPO Laptop Air 14', 24_990_000],
  ['oppo', 'OPPO Laptop Slim 13', 21_990_000],
  ['asus', 'ROG Zephyrus G16', 48_990_000],
  ['asus', 'ZenBook Pro 16X OLED', 55_990_000],
  ['asus', 'VivoBook Pro 16X OLED', 42_990_000],
  ['asus', 'ZenBook 14 OLED', 31_990_000],
];

const ACCESSORY_DEFS = [
  ['apple', 'AirPods Pro 2', 6_990_000],
  ['apple', 'AirPods 4', 4_990_000],
  ['apple', 'MagSafe Charger 25W', 1_290_000],
  ['apple', 'Apple Watch Series 10', 12_990_000],
  ['samsung', 'Galaxy Buds3 Pro', 4_990_000],
  ['samsung', 'Galaxy Buds3', 2_990_000],
  ['samsung', 'Galaxy Watch 7', 8_990_000],
  ['samsung', 'Samsung 45W Travel Adapter', 890_000],
  ['xiaomi', 'Xiaomi Buds 5 Pro', 3_990_000],
  ['xiaomi', 'Xiaomi Buds 5', 1_990_000],
  ['xiaomi', 'Mi Smart Band 9 Pro', 1_490_000],
  ['xiaomi', 'Xiaomi 67W Charger', 590_000],
  ['oppo', 'OPPO Enco X3', 4_490_000],
  ['oppo', 'OPPO Enco Air4 Pro', 2_490_000],
  ['oppo', 'OPPO Watch X', 9_990_000],
  ['oppo', 'OPPO 80W SuperVOOC Adapter', 690_000],
  ['asus', 'ROG Cetra True Wireless', 3_290_000],
  ['asus', 'ROG Delta S Wireless', 4_790_000],
  ['asus', 'ROG Strix Go 2.4', 2_990_000],
  ['asus', 'Asus ROG Phone Cooler', 1_290_000],
];

function attrsForCategory(category) {
  if (category === 'Điện thoại' || category === 'Máy tính bảng') {
    return [
      { name: 'Màu', values: ['Đen', 'Trắng'] },
      { name: 'Dung lượng', values: ['128GB', '256GB'] },
    ];
  }
  if (category === 'Laptop') {
    return [
      { name: 'Màu', values: ['Đen', 'Bạc'] },
      { name: 'RAM', values: ['16GB', '32GB'] },
    ];
  }
  return [
    { name: 'Màu', values: ['Đen', 'Trắng'] },
    { name: 'Phiên bản', values: ['Standard', 'Plus'] },
  ];
}

function buildProductRows() {
  const cat = (label, defs) =>
    defs.map(([brandSlug, name, basePrice]) => ({ category: label, brandSlug, name, basePrice }));
  return [
    ...cat('Điện thoại', PHONE_DEFS),
    ...cat('Máy tính bảng', TABLET_DEFS),
    ...cat('Laptop', LAPTOP_DEFS),
    ...cat('Phụ kiện', ACCESSORY_DEFS),
  ];
}

const shippingHN = {
  fullName: 'Nguyễn Văn An',
  phone: '0912345678',
  addressLine: '12 Nguyễn Trãi, Thanh Xuân',
  ward: 'Phường Khương Trung',
  city: 'Hà Nội',
};

const shippingHCM = {
  fullName: 'Trần Thị Bình',
  phone: '0987654321',
  addressLine: '45 Lê Lợi, Quận 1',
  ward: 'Phường Bến Nghé',
  city: 'TP.HCM',
};

let serialCounter = 0;

function nextPhoneImei() {
  serialCounter += 1;
  const tail = String(1000000000000 + serialCounter).slice(0, 13);
  return `86${tail}`;
}

function nextSnTabletLaptop() {
  serialCounter += 1;
  return `SN2024${String(serialCounter).padStart(8, '0')}`;
}

function nextAccessorySerial() {
  serialCounter += 1;
  return `BC${String(serialCounter).padStart(10, '0')}`;
}

function serialForCategory(category) {
  if (category === 'Điện thoại') return nextPhoneImei();
  if (category === 'Phụ kiện') return nextAccessorySerial();
  return nextSnTabletLaptop();
}

/**
 * @param {import('@prisma/client').PrismaClient} tx
 */
async function createProductWithVariants(tx, def, brandId) {
  const categoryCode = getCategoryCode(def.category);
  const slug = await generateUniqueProductSlug(tx, def.name);
  const slugShort = slug.replace(/[^a-z0-9]/gi, '').slice(0, 24) || 'p';

  const product = await tx.product.create({
    data: {
      name: def.name,
      slug,
      description: `Mô tả ${def.name} — dữ liệu demo NexTech (seed).`,
      price: def.basePrice,
      stock: 0,
      category: def.category,
      brandId,
      manufactureYear: 2024,
      hasVariants: true,
      isNewArrival: true,
      isBestseller: false,
      images: {
        create: [
          {
            url: `https://picsum.photos/seed/${encodeURIComponent(slugShort)}/800/600`,
            publicId: `seed-${slugShort}`,
          },
        ],
      },
    },
  });

  const attributes = attrsForCategory(def.category);
  const attrRows = [];
  for (let ai = 0; ai < attributes.length; ai += 1) {
    const attr = attributes[ai];
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
  const variants = [];
  for (const valueIds of combos) {
    const sku = await allocateSku(tx, categoryCode, product.id);
    const priceOffset = 0.01 * Math.floor(Math.random() * 50);
    const v = await tx.productVariant.create({
      data: {
        productId: product.id,
        sku,
        price: def.basePrice + priceOffset,
        stock: randInt(5, 30),
        imageUrl: null,
        values: {
          create: valueIds.map((attributeValueId) => ({ attributeValueId })),
        },
      },
    });
    variants.push(v);
  }

  const totalStock = variants.reduce((s, v) => s + v.stock, 0);
  await tx.product.update({
    where: { id: product.id },
    data: { stock: totalStock },
  });

  return { product, variants };
}

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@nextech.com';
  const adminPass = process.env.SEED_ADMIN_PASSWORD || 'Admin123!';
  const userPassPlain = 'User123!';

  await prisma.shopSettings.upsert({
    where: { id: 'singleton' },
    create: {
      id: 'singleton',
      shopName: 'NexTech',
      shopAddress: '123 Nguyễn Huệ, Q.1, TP.HCM',
      taxCode: '0123456789',
      phone: '0901234567',
      email: 'contact@nextech.com',
      vatRate: 0.1,
    },
    update: {
      shopName: 'NexTech',
      shopAddress: '123 Nguyễn Huệ, Q.1, TP.HCM',
      taxCode: '0123456789',
      phone: '0901234567',
      email: 'contact@nextech.com',
      vatRate: 0.1,
    },
  });

  for (const b of BRANDS_DATA) {
    await prisma.brand.upsert({
      where: { slug: b.slug },
      update: { name: b.name, description: b.description },
      create: b,
    });
  }

  const brandRecords = await prisma.brand.findMany();
  const brandBySlug = Object.fromEntries(brandRecords.map((x) => [x.slug, x.id]));

  const supplier = await prisma.supplier.create({
    data: {
      name: 'NexTech Warehouse',
      phone: '0901234567',
      address: 'Hà Nội',
    },
  });

  const adminHash = await bcrypt.hash(adminPass, 10);
  const userHash = await bcrypt.hash(userPassPlain, 10);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { role: 'ADMIN', password: adminHash, isEmailVerified: true },
    create: {
      email: adminEmail,
      name: 'Admin NexTech',
      password: adminHash,
      role: 'ADMIN',
      isEmailVerified: true,
    },
  });

  const user1 = await prisma.user.upsert({
    where: { email: 'user1@nextech.com' },
    update: { password: userHash, isEmailVerified: true, name: 'Nguyễn Văn An' },
    create: {
      email: 'user1@nextech.com',
      name: 'Nguyễn Văn An',
      password: userHash,
      role: 'USER',
      isEmailVerified: true,
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'user2@nextech.com' },
    update: { password: userHash, isEmailVerified: true, name: 'Trần Thị Bình' },
    create: {
      email: 'user2@nextech.com',
      name: 'Trần Thị Bình',
      password: userHash,
      role: 'USER',
      isEmailVerified: true,
    },
  });

  await prisma.address.deleteMany({
    where: { userId: { in: [user1.id, user2.id] } },
  });

  await prisma.address.createMany({
    data: [
      {
        userId: user1.id,
        fullName: 'Nguyễn Văn An',
        phone: '0912345678',
        address: '12 Nguyễn Trãi, Thanh Xuân',
        ward: 'Phường Khương Trung',
        city: 'Hà Nội',
        isDefault: true,
      },
      {
        userId: user2.id,
        fullName: 'Trần Thị Bình',
        phone: '0987654321',
        address: '45 Lê Lợi, Quận 1',
        ward: 'Phường Bến Nghé',
        city: 'TP.HCM',
        isDefault: true,
      },
    ],
  });

  const rows = buildProductRows();
  /** @type {Array<{ product: import('@prisma/client').Product, variants: import('@prisma/client').ProductVariant[] }>} */
  const seeded = [];

  for (const def of rows) {
    const bid = brandBySlug[def.brandSlug];
    if (!bid) throw new Error(`Missing brand ${def.brandSlug}`);
    const bundle = await prisma.$transaction((tx) => createProductWithVariants(tx, def, bid));
    seeded.push(bundle);

    const { product, variants } = bundle;
    const unitCost = Number(product.price) * 0.8;
    const serialCreates = [];
    for (const v of variants) {
      for (let k = 0; k < 3; k += 1) {
        serialCreates.push({
          serial: serialForCategory(def.category),
          productId: product.id,
          variantId: v.id,
          status: 'IN_STOCK',
        });
      }
    }

    await prisma.stockImport.create({
      data: {
        supplierId: supplier.id,
        productId: product.id,
        importedBy: admin.id,
        totalUnits: serialCreates.length,
        unitCost,
        notes: `Nhập kho seed — ${product.name}`,
        serialUnits: { create: serialCreates },
      },
    });
  }

  const p0 = seeded[0];
  const p1 = seeded[1];
  const p2 = seeded[2];
  const v00 = p0.variants[0];
  const v01 = p0.variants[1];
  const v10 = p1.variants[0];
  const v20 = p2.variants[0];

  const su00 = await prisma.serialUnit.findFirst({
    where: { variantId: v00.id, status: 'IN_STOCK' },
  });
  const su01 = await prisma.serialUnit.findFirst({
    where: { variantId: v01.id, status: 'IN_STOCK' },
  });
  const su20 = await prisma.serialUnit.findFirst({
    where: { variantId: v20.id, status: 'IN_STOCK' },
  });

  if (!su00 || !su01 || !su20) {
    throw new Error('Không đủ SerialUnit cho seed đơn hàng');
  }

  // user1 — đơn 1: COMPLETED + PAID (COD) — serial SOLD, invoice ISSUED
  const u1o1 = await prisma.order.create({
    data: {
      userId: user1.id,
      status: 'COMPLETED',
      paymentStatus: 'PAID',
      paymentMethod: 'COD',
      totalAmount: v00.price,
      discountAmount: 0,
      shippingAddress: shippingHN,
      orderItems: {
        create: [
          {
            productId: p0.product.id,
            variantId: v00.id,
            quantity: 1,
            price: v00.price,
            originalPrice: v00.price,
            serialUnitId: su00.id,
            assignedAt: new Date(),
          },
        ],
      },
    },
    include: { orderItems: true },
  });

  await prisma.serialUnit.update({
    where: { id: su00.id },
    data: { status: 'SOLD', soldAt: new Date() },
  });

  const draftInv = await createDraftInvoice(u1o1.id);
  await issueInvoice(draftInv.id);

  // user1 — đơn 2: SHIPPING + PAID (Stripe) — RESERVED
  const u1o2 = await prisma.order.create({
    data: {
      userId: user1.id,
      status: 'SHIPPING',
      paymentStatus: 'PAID',
      paymentMethod: 'STRIPE',
      stripePaymentIntentId: `pi_seed_u1o2_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      totalAmount: v01.price,
      discountAmount: 0,
      shippingAddress: shippingHN,
      trackingCode: 'VN123456789',
      trackingUrl: 'https://example.com/track',
      carrierName: 'GHTK',
      orderItems: {
        create: [
          {
            productId: p0.product.id,
            variantId: v01.id,
            quantity: 1,
            price: v01.price,
            originalPrice: v01.price,
            serialUnitId: su01.id,
            assignedAt: new Date(),
          },
        ],
      },
    },
  });

  await prisma.serialUnit.update({
    where: { id: su01.id },
    data: { status: 'RESERVED', reservedAt: new Date() },
  });

  // user1 — đơn 3: CONFIRMED + UNPAID (COD)
  await prisma.order.create({
    data: {
      userId: user1.id,
      status: 'CONFIRMED',
      paymentStatus: 'UNPAID',
      paymentMethod: 'COD',
      totalAmount: v10.price,
      discountAmount: 0,
      shippingAddress: shippingHN,
      orderItems: {
        create: [
          {
            productId: p1.product.id,
            variantId: v10.id,
            quantity: 1,
            price: v10.price,
            originalPrice: v10.price,
          },
        ],
      },
    },
  });

  // user1 — đơn 4: CANCELLED + UNPAID
  await prisma.order.create({
    data: {
      userId: user1.id,
      status: 'CANCELLED',
      paymentStatus: 'UNPAID',
      paymentMethod: 'COD',
      totalAmount: p1.variants[1].price,
      discountAmount: 0,
      shippingAddress: shippingHN,
      orderItems: {
        create: [
          {
            productId: p1.product.id,
            variantId: p1.variants[1].id,
            quantity: 1,
            price: p1.variants[1].price,
            originalPrice: p1.variants[1].price,
          },
        ],
      },
    },
  });

  // user2 — đơn 1: COMPLETED + PAID (COD) — Review
  const u2o1 = await prisma.order.create({
    data: {
      userId: user2.id,
      status: 'COMPLETED',
      paymentStatus: 'PAID',
      paymentMethod: 'COD',
      totalAmount: v20.price,
      discountAmount: 0,
      shippingAddress: shippingHCM,
      orderItems: {
        create: [
          {
            productId: p2.product.id,
            variantId: v20.id,
            quantity: 1,
            price: v20.price,
            originalPrice: v20.price,
            serialUnitId: su20.id,
            assignedAt: new Date(),
          },
        ],
      },
    },
    include: { orderItems: true },
  });

  await prisma.serialUnit.update({
    where: { id: su20.id },
    data: { status: 'SOLD', soldAt: new Date() },
  });

  await prisma.review.create({
    data: {
      userId: user2.id,
      productId: p2.product.id,
      orderItemId: u2o1.orderItems[0].id,
      rating: 5,
      comment: 'Sản phẩm tuyệt vời, giao nhanh — seed review.',
    },
  });

  const su10b = await prisma.serialUnit.findFirst({
    where: { variantId: v10.id, status: 'IN_STOCK' },
  });

  // user2 — đơn 2: PACKING + PAID (Stripe)
  if (su10b) {
    const u2o2 = await prisma.order.create({
      data: {
        userId: user2.id,
        status: 'PACKING',
        paymentStatus: 'PAID',
        paymentMethod: 'STRIPE',
        stripePaymentIntentId: `pi_seed_pack_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        totalAmount: v10.price,
        discountAmount: 0,
        shippingAddress: shippingHCM,
        orderItems: {
          create: [
            {
              productId: p1.product.id,
              variantId: v10.id,
              quantity: 1,
              price: v10.price,
              originalPrice: v10.price,
              serialUnitId: su10b.id,
              assignedAt: new Date(),
            },
          ],
        },
      },
    });
    await prisma.serialUnit.update({
      where: { id: su10b.id },
      data: { status: 'RESERVED', reservedAt: new Date() },
    });
    void u2o2;
  }

  // user2 — đơn 3: PENDING + UNPAID (COD)
  await prisma.order.create({
    data: {
      userId: user2.id,
      status: 'PENDING',
      paymentStatus: 'UNPAID',
      paymentMethod: 'COD',
      totalAmount: seeded[3].variants[0].price,
      discountAmount: 0,
      shippingAddress: shippingHCM,
      orderItems: {
        create: [
          {
            productId: seeded[3].product.id,
            variantId: seeded[3].variants[0].id,
            quantity: 1,
            price: seeded[3].variants[0].price,
            originalPrice: seeded[3].variants[0].price,
          },
        ],
      },
    },
  });

  // user2 — đơn 4: RETURNED + REFUNDED
  const v40 = seeded[4].variants[0];
  const su40 = await prisma.serialUnit.findFirst({
    where: { variantId: v40.id, status: 'IN_STOCK' },
  });
  if (su40) {
    const u2o4 = await prisma.order.create({
      data: {
        userId: user2.id,
        status: 'RETURNED',
        paymentStatus: 'REFUNDED',
        paymentMethod: 'STRIPE',
        stripePaymentIntentId: `pi_seed_ret_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        totalAmount: v40.price,
        discountAmount: 0,
        shippingAddress: shippingHCM,
        orderItems: {
          create: [
            {
              productId: seeded[4].product.id,
              variantId: v40.id,
              quantity: 1,
              price: v40.price,
              originalPrice: v40.price,
              serialUnitId: su40.id,
              assignedAt: new Date(),
            },
          ],
        },
      },
    });
    await prisma.serialUnit.update({
      where: { id: su40.id },
      data: { status: 'RETURNED', returnedAt: new Date() },
    });
    void u2o4;
  }

  console.log(`Admin: ${adminEmail} / ${adminPass}`);
  console.log('User 1: user1@nextech.com / User123!');
  console.log('User 2: user2@nextech.com / User123!');
  console.log(`Done. ${rows.length} products, brands: ${BRANDS_DATA.length}, supplier: ${supplier.name}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
