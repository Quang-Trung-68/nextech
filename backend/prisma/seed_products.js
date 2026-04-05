/* eslint-disable no-console */
/**
 * Full reset DB + seed từ products.json:
 * - TRUNCATE toàn bộ bảng (CASCADE)
 * - ShopSettings, Users, Supplier, Brands, Products (2×2 variants + specsJson), StockImport, sample Orders/Review
 *
 * Thứ tự tìm file:
 *   1. PRODUCTS_JSON_PATH
 *   2. prisma/seeds/data/products.json
 *   3. ../../products.json (root repo)
 *   4. ../products.json (cạnh backend)
 *
 * Chạy: npm run db:seed:products (từ backend)
 */
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const bcrypt = require('bcryptjs');
const prisma = require('../src/utils/prisma');
const { getCategoryCode, generateSku } = require('../src/utils/sku');
const { generateBaseSlug } = require('../src/utils/productSlugify');
const { createDraftInvoice, issueInvoice } = require('../src/services/invoice.service');

function loadProductsData() {
  const candidates = [
    process.env.PRODUCTS_JSON_PATH,
    path.join(__dirname, 'seeds/data/products.json'),
    path.join(__dirname, '../../products.json'),
    path.join(__dirname, '../products.json'),
  ].filter(Boolean);

  for (const filePath of candidates) {
    if (!fs.existsSync(filePath)) continue;
    try {
      const raw = fs.readFileSync(filePath, 'utf8');
      const data = JSON.parse(raw);
      // eslint-disable-next-line no-console
      console.log(`📄 Đọc: ${path.resolve(filePath)}`);
      return data;
    } catch (e) {
      throw new Error(`Đọc products JSON thất bại (${filePath}): ${e.message}`);
    }
  }

  throw new Error(
    `Không tìm thấy products.json. Thử:\n${candidates.join('\n')}\nHoặc PRODUCTS_JSON_PATH=...`,
  );
}

const randInt = (min, max) => min + Math.floor(Math.random() * (max - min + 1));

function cartesian(arrays) {
  return arrays.reduce((acc, curr) => {
    if (!acc.length) return curr.map((x) => [x]);
    return acc.flatMap((a) => curr.map((c) => [...a, c]));
  }, []);
}

function weightedSaleSold() {
  const r = Math.random();
  if (r < 0.6) return randInt(50, 499);
  if (r < 0.9) return randInt(500, 2000);
  return randInt(2001, 5000);
}

function extractPublicId(url) {
  if (!url || typeof url !== 'string') return 'img';
  const tail = url.split('/').pop() || 'img';
  return tail.split('.')[0] || 'img';
}

function normalizeCategory(raw) {
  const key = String(raw || '')
    .trim()
    .normalize('NFC')
    .toLowerCase();
  const map = {
    'điện thoại': 'Điện thoại',
    laptop: 'Laptop',
    'tai nghe': 'Tai nghe',
    'phụ kiện': 'Phụ kiện',
    phu_kien: 'Phụ kiện',
    'máy tính bảng': 'Máy tính bảng',
    'may tinh bang': 'Máy tính bảng',
    tablet: 'Máy tính bảng',
    // slug crawl / typo không dấu
    'may-tinh-bang': 'Máy tính bảng',
  };
  const mapped = map[key];
  if (mapped) return mapped;
  const trimmed = String(raw || '').trim();
  if (trimmed) return trimmed;
  return 'Phụ kiện';
}

/** Đảm bảo object lưu được vào cột Json (Prisma/PostgreSQL). */
function sanitizeSpecsJson(specs) {
  if (!specs || typeof specs !== 'object' || Array.isArray(specs)) return null;
  const keys = Object.keys(specs);
  if (keys.length === 0) return null;
  try {
    return JSON.parse(JSON.stringify(specs));
  } catch {
    return null;
  }
}

/** Chỉ 2 thuộc tính × 2 giá trị = 4 biến thể */
function variantAttrsForCategory(categoryLabel) {
  const c = String(categoryLabel);
  if (c === 'Điện thoại') {
    return [
      { name: 'Màu', values: ['Đen', 'Trắng'] },
      { name: 'Dung lượng', values: ['128GB', '256GB'] },
    ];
  }
  if (c === 'Laptop') {
    return [
      { name: 'Màu', values: ['Đen', 'Bạc'] },
      { name: 'Cấu hình', values: ['16GB/512GB', '32GB/1TB'] },
    ];
  }
  if (c === 'Máy tính bảng') {
    return [
      { name: 'Màu', values: ['Đen', 'Bạc'] },
      { name: 'Dung lượng', values: ['128GB', '256GB'] },
    ];
  }
  if (c === 'Tai nghe') {
    return [
      { name: 'Màu', values: ['Đen', 'Trắng'] },
      { name: 'Phiên bản', values: ['Standard', 'Pro'] },
    ];
  }
  return [
    { name: 'Màu', values: ['Đen', 'Trắng'] },
    { name: 'Phiên bản', values: ['Standard', 'Plus'] },
  ];
}

async function allocateSku(tx, categoryCode, productId) {
  for (let i = 1; i < 100000; i += 1) {
    const sku = generateSku(categoryCode, productId, i);
    const taken = await tx.productVariant.findUnique({ where: { sku } });
    if (!taken) return sku;
  }
  throw new Error('Cannot allocate SKU');
}

function buildImages(imageUrl, slugShort) {
  const safe = encodeURIComponent((slugShort || 'p').replace(/[^a-z0-9]/gi, '').slice(0, 40) || 'p');
  const urls = [];
  if (imageUrl) urls.push(imageUrl);
  for (let i = 0; i < 5 - urls.length; i += 1) {
    urls.push(`https://picsum.photos/seed/${safe}-${i}/800/800`);
  }
  return urls.slice(0, 5).map((u) => ({
    url: u,
    publicId: (extractPublicId(u).slice(0, 120) || `seed-${safe}`).slice(0, 200),
  }));
}

function resolveSalePrice(price, salePrice) {
  if (salePrice == null || salePrice === '') return null;
  const sp = Number(salePrice);
  const p = Number(price);
  if (Number.isNaN(sp) || Number.isNaN(p)) return null;
  if (sp >= p) return null;
  return sp;
}

function realisticRating(p) {
  const r = Number(p.rating);
  if (r > 0 && r <= 5) return Math.round(r * 10) / 10;
  return parseFloat((3.5 + Math.random() * 1.5).toFixed(1));
}

function realisticNumReviews(p, saleSoldCount) {
  const n = Number(p.numReviews);
  if (n > 0) return Math.min(500, Math.floor(n));
  return Math.min(500, Math.max(10, Math.floor(saleSoldCount * 0.15)));
}

function randomCreatedAt() {
  return new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000);
}

function resolveProductSlugs(products) {
  const counts = {};
  return products.map((p) => {
    const base =
      (p.slug && generateBaseSlug(String(p.slug))) || generateBaseSlug(p.name) || 'san-pham';
    counts[base] = (counts[base] || 0) + 1;
    const c = counts[base];
    return c === 1 ? base : `${base}-${c}`;
  });
}

async function resetAllTables() {
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE
      "invoice_items",
      "invoices",
      "coupon_usages",
      "coupons",
      "serial_units",
      "stock_imports",
      "suppliers",
      "reviews",
      "order_item",
      "orders",
      "cart_items",
      "carts",
      "favorites",
      "notifications",
      "product_variant_values",
      "product_variants",
      "product_attribute_values",
      "product_attributes",
      "product_images",
      "products",
      "brands",
      "post_tags",
      "posts",
      "tags",
      "categories",
      "addresses",
      "revoked_tokens",
      "refresh_tokens",
      "password_reset_tokens",
      "oauth_accounts",
      "users",
      "failed_emails",
      "shop_settings"
    RESTART IDENTITY CASCADE;
  `);
  console.log('Đã TRUNCATE toàn bộ bảng (CASCADE).');
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
  if (category === 'Phụ kiện' || category === 'Tai nghe') return nextAccessorySerial();
  return nextSnTabletLaptop();
}

/**
 * @param {import('@prisma/client').Prisma.TransactionClient} tx
 */
async function createProductFromJson(tx, p, brandId, resolvedSlug) {
  const categoryLabel = normalizeCategory(p.category);
  const categoryCode = getCategoryCode(categoryLabel);
  const price = Number(p.price);
  if (Number.isNaN(price) || price <= 0) {
    throw new Error(`Giá không hợp lệ: ${p.price}`);
  }

  const salePrice = resolveSalePrice(price, p.salePrice);
  const saleSoldCount = weightedSaleSold();
  const rating = realisticRating(p);
  const numReviews = realisticNumReviews(p, saleSoldCount);
  const isBestseller = saleSoldCount > 1500;

  const specsObj = sanitizeSpecsJson(p.specs);

  const slugShort = resolvedSlug.replace(/[^a-z0-9]/gi, '').slice(0, 24) || 'p';
  const primaryUrl = p.imageUrl || (Array.isArray(p.images) && p.images[0]) || '';
  const imageRows = buildImages(primaryUrl, slugShort);

  const product = await tx.product.create({
    data: {
      name: p.name,
      slug: resolvedSlug,
      description: p.description || `Mô tả ${p.name} — seed NexTech.`,
      price,
      stock: 0,
      category: categoryLabel,
      brandId,
      rating,
      numReviews,
      salePrice,
      saleExpiresAt: null,
      saleStock: null,
      saleSoldCount,
      isBestseller,
      isNewArrival: true,
      manufactureYear: 2024,
      hasVariants: true,
      lowStockThreshold: 5,
      specsJson: specsObj,
      createdAt: randomCreatedAt(),
      images: { create: imageRows },
    },
  });

  const attributes = variantAttrsForCategory(categoryLabel);
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
    const variantPrice = price + priceOffset;
    const vStock = randInt(0, 50);

    const v = await tx.productVariant.create({
      data: {
        productId: product.id,
        sku,
        price: variantPrice,
        stock: vStock,
        imageUrl: null,
        lowStockThreshold: 5,
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

async function seedBrandsFromProducts(products) {
  const bySlug = new Map();
  for (const p of products) {
    const name = (p.brandName && String(p.brandName).trim()) || 'Khác';
    const slug = (p.brandSlug && generateBaseSlug(p.brandSlug)) || generateBaseSlug(name);
    if (!bySlug.has(slug)) {
      bySlug.set(slug, { name, slug });
    }
  }

  const logoFor = (name) =>
    `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=128&background=random`;

  for (const { name, slug } of bySlug.values()) {
    await prisma.brand.create({
      data: {
        name,
        slug,
        description: `Thương hiệu ${name} — seed từ CellphoneS.`,
        logo: logoFor(name),
      },
    });
  }

  const brands = await prisma.brand.findMany();
  return Object.fromEntries(brands.map((b) => [b.slug, b.id]));
}

async function main() {
  const productsData = loadProductsData();
  const products = Array.isArray(productsData.products) ? productsData.products : [];
  const total = products.length;
  const metaTotal = productsData.meta && productsData.meta.totalProducts;
  if (metaTotal != null && Number(metaTotal) !== total) {
    console.warn(
      `⚠️ meta.totalProducts (${metaTotal}) khác số phần tử mảng products (${total}) — seed theo ${total} bản ghi.`,
    );
  }

  console.log(`🌱 Full reset + seed ${total} sản phẩm từ JSON...`);
  await resetAllTables();

  await prisma.shopSettings.create({
    data: {
      id: 'singleton',
      shopName: 'NexTech',
      shopAddress: '123 Nguyễn Huệ, Q.1, TP.HCM',
      taxCode: '0123456789',
      phone: '0901234567',
      email: 'contact@nextech.com',
      vatRate: 0.1,
    },
  });

  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@nextech.com';
  const adminPass = process.env.SEED_ADMIN_PASSWORD || 'Admin123!';
  const userPassPlain = 'User123!';

  const adminHash = await bcrypt.hash(adminPass, 10);
  const userHash = await bcrypt.hash(userPassPlain, 10);

  const admin = await prisma.user.create({
    data: {
      email: adminEmail,
      name: 'Admin NexTech',
      password: adminHash,
      role: 'ADMIN',
      isEmailVerified: true,
    },
  });

  const user1 = await prisma.user.create({
    data: {
      email: 'user1@nextech.com',
      name: 'Nguyễn Văn An',
      password: userHash,
      role: 'USER',
      isEmailVerified: true,
    },
  });

  const user2 = await prisma.user.create({
    data: {
      email: 'user2@nextech.com',
      name: 'Trần Thị Bình',
      password: userHash,
      role: 'USER',
      isEmailVerified: true,
    },
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

  const supplier = await prisma.supplier.create({
    data: {
      name: 'NexTech Warehouse',
      phone: '0901234567',
      address: 'Hà Nội',
    },
  });

  const brandMap = await seedBrandsFromProducts(products);
  const resolvedSlugs = resolveProductSlugs(products);

  /** @type {Array<{ bundle: { product: import('@prisma/client').Product, variants: import('@prisma/client').ProductVariant[] }, row: typeof products[0] }>} */
  const seeded = [];

  for (let i = 0; i < products.length; i += 1) {
    const p = products[i];
    const brandSlug =
      (p.brandSlug && String(p.brandSlug).trim() && generateBaseSlug(p.brandSlug)) ||
      generateBaseSlug((p.brandName && String(p.brandName).trim()) || 'Khác');
    const brandId = brandMap[brandSlug];
    if (!brandId) {
      console.error(
        `✗ [${i + 1}/${total}] ${p.name}: không map được brand (slug="${brandSlug}" từ brandSlug/brandName)`,
      );
      // eslint-disable-next-line no-continue
      continue;
    }

    try {
      const bundle = await prisma.$transaction((tx) =>
        createProductFromJson(tx, p, brandId, resolvedSlugs[i]),
      );
      seeded.push({ bundle, row: p });
      console.log(`✓ [${i + 1}/${total}] ${p.name}`);
    } catch (e) {
      console.error(`✗ [${i + 1}/${total}] ${p.name}: ${e.message}`);
    }
  }

  if (seeded.length !== total) {
    console.warn(
      `\n⚠️ Chỉ seed được ${seeded.length}/${total} sản phẩm. Kiểm tra log ✗ phía trên (brand, giá, slug trùng DB...).`,
    );
  }

  for (let i = 0; i < seeded.length; i += 1) {
    const { bundle, row: def } = seeded[i];
    const { product, variants } = bundle;
    const categoryLabel = normalizeCategory(def.category);
    const unitCost = Number(product.price) * 0.8;
    const serialCreates = [];
    for (const v of variants) {
      for (let k = 0; k < 3; k += 1) {
        serialCreates.push({
          serial: serialForCategory(categoryLabel),
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

  if (seeded.length < 3) {
    console.warn('Không đủ sản phẩm để seed đơn hàng mẫu (cần ≥3).');
  } else {
    const p0 = seeded[0].bundle;
    const p1 = seeded[1].bundle;
    const p2 = seeded[2].bundle;
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

    if (su00 && su01 && su20) {
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

      await prisma.order.create({
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
          comment: 'Sản phẩm tuyệt vời — seed review.',
        },
      });
    }
  }

  console.log(
    `✅ Hoàn tất. ${seeded.length}/${total} sản phẩm, ${Object.keys(brandMap).length} hãng.`,
  );
  console.log(`Admin: ${adminEmail} / ${adminPass}`);
  console.log('User 1: user1@nextech.com / User123!');
  console.log('User 2: user2@nextech.com / User123!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
