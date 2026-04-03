/* eslint-disable no-console */
/**
 * Seed demo: suppliers, nhập kho + serial, user test, đơn hàng mẫu mọi trạng thái.
 * Chạy sau: npx prisma db seed
 *   node prisma/seed-demo.js
 */
const bcrypt = require('bcryptjs');
const prisma = require('../src/utils/prisma');

const demoAddr = {
  fullName: 'Người mua Demo',
  phone: '0901234567',
  addressLine: '123 Đường Demo',
  ward: 'Phường 1',
  city: 'TP.HCM',
};

async function main() {
  const admin = await prisma.user.findFirst({ where: { email: 'admin@nextech.local' } });
  if (!admin) {
    console.error('Chạy trước: npx prisma db seed');
    process.exit(1);
  }

  const userPass = await bcrypt.hash('User123!', 10);
  const demoUser = await prisma.user.upsert({
    where: { email: 'user@nextech.local' },
    update: { password: userPass, isEmailVerified: true },
    create: {
      email: 'user@nextech.local',
      name: 'User Demo',
      password: userPass,
      role: 'USER',
      isEmailVerified: true,
    },
  });
  console.log('User demo: user@nextech.local / User123!');

  const [s1, s2, s3] = await Promise.all([
    prisma.supplier.create({
      data: {
        name: 'Công ty TNHH Phân phối Apple Việt Nam',
        phone: '028-1111-2222',
        email: 'contact@apple-vn.demo',
        address: 'Quận 1, TP.HCM',
      },
    }),
    prisma.supplier.create({
      data: {
        name: 'Samsung Electronics Vina Co., Ltd.',
        phone: '028-3333-4444',
        email: 'b2b@samsung.demo',
        address: 'KCN Samsung, Bắc Ninh',
      },
    }),
    prisma.supplier.create({
      data: {
        name: 'Kho Nhập Linh Kiện Tổng Hợp',
        phone: '0909999888',
        email: 'kho@linhkien.demo',
        address: 'Hà Nội',
      },
    }),
  ]);
  console.log('Suppliers:', s1.name, s2.name, s3.name);

  const iphone = await prisma.product.findFirst({
    where: { name: { contains: 'iPhone 15 Pro Max' } },
    include: { variants: { where: { deletedAt: null }, take: 20 } },
  });
  const samsung = await prisma.product.findFirst({
    where: { name: { contains: 'Galaxy S24 Ultra' } },
    include: { variants: { where: { deletedAt: null }, take: 20 } },
  });

  if (!iphone?.variants?.length || !samsung?.variants?.length) {
    console.error('Không tìm thấy biến thể iPhone / Samsung — kiểm tra seed sản phẩm');
    process.exit(1);
  }

  const vIphone = iphone.variants[0];
  const vSamsung = samsung.variants[0];

  async function importBatch({ supplierId, productId, variantId, serials, label }) {
    const totalUnits = serials.length;
    await prisma.$transaction(async (tx) => {
      const imp = await tx.stockImport.create({
        data: {
          supplierId,
          productId,
          variantId,
          importedBy: admin.id,
          totalUnits,
          notes: label,
          serialUnits: {
            create: serials.map((serial) => ({
              serial,
              productId,
              variantId,
              status: 'IN_STOCK',
            })),
          },
        },
      });
      await tx.productVariant.update({
        where: { id: variantId },
        data: { stock: { increment: totalUnits } },
      });
      return imp;
    });
  }

  await importBatch({
    supplierId: s1.id,
    productId: iphone.id,
    variantId: vIphone.id,
    serials: Array.from({ length: 10 }, (_, i) => `IMEI-IPHONE-${String(i + 1).padStart(3, '0')}`),
    label: 'Lô iPhone demo',
  });
  await importBatch({
    supplierId: s2.id,
    productId: samsung.id,
    variantId: vSamsung.id,
    serials: Array.from({ length: 10 }, (_, i) => `IMEI-SAMSUNG-${String(i + 1).padStart(3, '0')}`),
    label: 'Lô Samsung demo',
  });

  // Đặt vài serial sang trạng thái khác để demo tra cứu
  const demoSerials = await prisma.serialUnit.findMany({
    where: { serial: { startsWith: 'IMEI-IPHONE-00' } },
    orderBy: { serial: 'asc' },
    take: 5,
  });
  if (demoSerials[2]) {
    await prisma.serialUnit.update({
      where: { id: demoSerials[2].id },
      data: { status: 'RESERVED', reservedAt: new Date() },
    });
  }
  if (demoSerials[3]) {
    await prisma.serialUnit.update({
      where: { id: demoSerials[3].id },
      data: { status: 'SOLD', soldAt: new Date() },
    });
  }
  if (demoSerials[4]) {
    await prisma.serialUnit.update({
      where: { id: demoSerials[4].id },
      data: { status: 'RETURNED', returnedAt: new Date() },
    });
  }

  const mkItem = (productId, variantId, qty, price) => ({
    productId,
    variantId,
    quantity: qty,
    price,
    originalPrice: price,
  });

  const priceI = Number(vIphone.price);
  const priceS = Number(vSamsung.price);

  // Helper: tạo đơn + optional serial link
  async function seedOrder(status, extra = {}) {
    const o = await prisma.order.create({
      data: {
        userId: demoUser.id,
        status,
        paymentStatus: extra.paymentStatus ?? (status === 'COMPLETED' ? 'PAID' : 'UNPAID'),
        paymentMethod: extra.paymentMethod ?? 'COD',
        totalAmount: priceI,
        discountAmount: 0,
        shippingAddress: demoAddr,
        orderItems: {
          create: [mkItem(iphone.id, vIphone.id, 1, priceI)],
        },
        ...extra.orderData,
      },
      include: { orderItems: true },
    });
    return o;
  }

  // 1 PENDING
  await seedOrder('PENDING', { paymentMethod: 'COD' });
  // 2 CONFIRMED (giả lập đã trừ kho — trừ tay)
  await prisma.$transaction(async (tx) => {
    const o = await tx.order.create({
      data: {
        userId: demoUser.id,
        status: 'CONFIRMED',
        paymentStatus: 'UNPAID',
        paymentMethod: 'COD',
        totalAmount: priceI,
        discountAmount: 0,
        shippingAddress: demoAddr,
        orderItems: { create: [mkItem(iphone.id, vIphone.id, 1, priceI)] },
      },
      include: { orderItems: true },
    });
    await tx.productVariant.update({
      where: { id: vIphone.id },
      data: { stock: { decrement: 1 } },
    });
    return o;
  });

  // 3 PACKING — có serial RESERVED
  let oPackId = null;
  await prisma.$transaction(async (tx) => {
    const o = await tx.order.create({
      data: {
        userId: demoUser.id,
        status: 'CONFIRMED',
        paymentStatus: 'UNPAID',
        paymentMethod: 'COD',
        totalAmount: priceI,
        discountAmount: 0,
        shippingAddress: demoAddr,
        orderItems: { create: [mkItem(iphone.id, vIphone.id, 1, priceI)] },
      },
      include: { orderItems: true },
    });
    oPackId = o.id;
    await tx.productVariant.update({ where: { id: vIphone.id }, data: { stock: { decrement: 1 } } });
    const su = await tx.serialUnit.findFirst({
      where: { productId: iphone.id, variantId: vIphone.id, status: 'IN_STOCK' },
    });
    if (su) {
      await tx.serialUnit.update({
        where: { id: su.id },
        data: { status: 'RESERVED', reservedAt: new Date() },
      });
      await tx.orderItem.update({
        where: { id: o.orderItems[0].id },
        data: { serialUnitId: su.id, assignedAt: new Date() },
      });
    }
    await tx.order.update({
      where: { id: o.id },
      data: { status: 'PACKING' },
    });
  });

  // 4 SHIPPING
  await prisma.order.create({
    data: {
      userId: demoUser.id,
      status: 'SHIPPING',
      paymentStatus: 'UNPAID',
      paymentMethod: 'COD',
      totalAmount: priceS,
      discountAmount: 0,
      shippingAddress: demoAddr,
      carrierName: 'Giao Hàng Nhanh',
      trackingCode: 'GHN-DEMO-001',
      trackingUrl: 'https://ghn.vn/demo',
      orderItems: { create: [mkItem(samsung.id, vSamsung.id, 1, priceS)] },
    },
  });

  // 5 COMPLETED
  await prisma.$transaction(async (tx) => {
    const o = await tx.order.create({
      data: {
        userId: demoUser.id,
        status: 'SHIPPING',
        paymentStatus: 'PAID',
        paymentMethod: 'COD',
        totalAmount: priceS,
        discountAmount: 0,
        shippingAddress: demoAddr,
        carrierName: 'J&T',
        trackingCode: 'JT-DEMO-002',
        orderItems: { create: [mkItem(samsung.id, vSamsung.id, 1, priceS)] },
      },
      include: { orderItems: true },
    });
    await tx.productVariant.update({ where: { id: vSamsung.id }, data: { stock: { decrement: 1 } } });
    const su = await tx.serialUnit.findFirst({
      where: { productId: samsung.id, variantId: vSamsung.id, status: 'IN_STOCK' },
    });
    if (su) {
      await tx.serialUnit.update({
        where: { id: su.id },
        data: { status: 'SOLD', soldAt: new Date() },
      });
      await tx.orderItem.update({
        where: { id: o.orderItems[0].id },
        data: { serialUnitId: su.id, assignedAt: new Date() },
      });
    }
    return tx.order.update({
      where: { id: o.id },
      data: { status: 'COMPLETED', paymentStatus: 'PAID' },
    });
  });

  // 6 CANCELLED
  await prisma.order.create({
    data: {
      userId: demoUser.id,
      status: 'CANCELLED',
      paymentStatus: 'UNPAID',
      paymentMethod: 'COD',
      totalAmount: priceI,
      discountAmount: 0,
      shippingAddress: demoAddr,
      orderItems: { create: [mkItem(iphone.id, vIphone.id, 1, priceI)] },
    },
  });

  // 7 RETURNED
  await prisma.$transaction(async (tx) => {
    const o = await tx.order.create({
      data: {
        userId: demoUser.id,
        status: 'RETURNED',
        paymentStatus: 'PAID',
        paymentMethod: 'COD',
        totalAmount: priceI,
        discountAmount: 0,
        shippingAddress: demoAddr,
        orderItems: { create: [mkItem(iphone.id, vIphone.id, 1, priceI)] },
      },
      include: { orderItems: true },
    });
    const su = await tx.serialUnit.findFirst({
      where: { productId: iphone.id, variantId: vIphone.id, status: 'IN_STOCK' },
    });
    if (su) {
      await tx.serialUnit.update({
        where: { id: su.id },
        data: { status: 'RETURNED', returnedAt: new Date() },
      });
      await tx.orderItem.update({
        where: { id: o.orderItems[0].id },
        data: { serialUnitId: su.id, assignedAt: new Date() },
      });
    }
    return o;
  });

  console.log('seed-demo: đơn mẫu (PENDING, CONFIRMED, PACKING, SHIPPING, COMPLETED, CANCELLED, RETURNED) + nhập kho serial.');
  console.log('Order PACKING id:', oPackId || '(n/a)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
