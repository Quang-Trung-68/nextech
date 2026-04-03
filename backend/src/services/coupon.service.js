const prisma = require('../utils/prisma');
const { AppError, NotFoundError } = require('../errors/AppError');

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Tính số tiền discount dựa trên type và value của coupon.
 * @param {object} coupon - Coupon từ DB
 * @param {number} orderAmount - Tổng tiền đơn hàng (trước discount)
 * @returns {number} discountAmount
 */
const _calcDiscountAmount = (coupon, orderAmount) => {
  let discountAmount = 0;

  if (coupon.type === 'PERCENTAGE') {
    discountAmount = orderAmount * (coupon.value / 100);
    // Cap theo maxDiscountAmount nếu có
    if (coupon.maxDiscountAmount != null && discountAmount > coupon.maxDiscountAmount) {
      discountAmount = coupon.maxDiscountAmount;
    }
  } else {
    // FIXED_AMOUNT: không được vượt quá orderAmount
    discountAmount = Math.min(coupon.value, orderAmount);
  }

  // Làm tròn đến 2 chữ số thập phân
  return Math.round(discountAmount * 100) / 100;
};

// ─── validateCoupon ───────────────────────────────────────────────────────────

/**
 * Validate và tính discount cho 1 mã coupon.
 * Không ghi bất kỳ gì vào DB — chỉ read-only.
 *
 * @param {{ code: string, userId: string, orderAmount: number }} params
 * @returns {{ coupon: object, discountAmount: number }}
 */
const validateCoupon = async ({ code, userId, orderAmount }) => {
  // 1. Tìm coupon (case-insensitive)
  const coupon = await prisma.coupon.findFirst({
    where: { code: { equals: code.toUpperCase() } },
  });

  if (!coupon) {
    throw new AppError('Mã giảm giá không tồn tại', 404, 'COUPON_NOT_FOUND');
  }

  // 2. Kiểm tra isActive
  if (!coupon.isActive) {
    throw new AppError('Mã giảm giá không còn hiệu lực', 400, 'COUPON_INACTIVE');
  }

  // 3. Kiểm tra hết hạn
  if (new Date() > coupon.expiresAt) {
    throw new AppError('Mã giảm giá đã hết hạn', 400, 'COUPON_EXPIRED');
  }

  // 4. Kiểm tra lượt dùng toàn hệ thống
  if (coupon.usedCount >= coupon.maxUsage) {
    throw new AppError('Mã giảm giá đã hết lượt sử dụng', 400, 'COUPON_MAX_USAGE_REACHED');
  }

  // 5. Kiểm tra giá trị đơn hàng tối thiểu
  if (orderAmount < coupon.minOrderAmount) {
    throw new AppError(
      `Đơn hàng tối thiểu ${coupon.minOrderAmount.toLocaleString('vi-VN')}đ để dùng mã này`,
      400,
      'COUPON_MIN_ORDER_NOT_MET'
    );
  }

  // 6. Kiểm tra user đã dùng mã này chưa
  const existingUsage = await prisma.couponUsage.findUnique({
    where: { couponId_userId: { couponId: coupon.id, userId } },
  });

  if (existingUsage) {
    throw new AppError('Bạn đã sử dụng mã này rồi', 400, 'COUPON_ALREADY_USED');
  }

  // 7. Tính discountAmount
  const discountAmount = _calcDiscountAmount(coupon, orderAmount);

  return { coupon, discountAmount };
};

/**
 * Mô tả quy tắc giảm giá (hiển thị trên checkout / email).
 */
function formatCouponRuleDescription(coupon) {
  if (coupon.type === 'PERCENTAGE') {
    let s = `Giảm ${Number(coupon.value)}% trên tổng giá trị đơn`;
    if (coupon.maxDiscountAmount != null) {
      s += ` (tối đa ${Number(coupon.maxDiscountAmount).toLocaleString('vi-VN')}đ)`;
    }
    return s;
  }
  return `Giảm ${Number(coupon.value).toLocaleString('vi-VN')}đ (cố định)`;
}

// ─── Admin: CRUD ──────────────────────────────────────────────────────────────

/**
 * Admin tạo mã coupon mới.
 * code tự động uppercase để đảm bảo nhất quán.
 */
const createCoupon = async (data) => {
  const { code, type, value, minOrderAmount, maxUsage, expiresAt, maxDiscountAmount } = data;

  const coupon = await prisma.coupon.create({
    data: {
      code: code.toUpperCase(),
      type,
      value,
      minOrderAmount,
      maxUsage,
      expiresAt: new Date(expiresAt),
      maxDiscountAmount: maxDiscountAmount ?? null,
    },
  });

  return coupon;
};

/**
 * Admin xem danh sách tất cả mã coupon (sắp xếp mới nhất trước).
 */
const listCoupons = async () => {
  return prisma.coupon.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { couponUsages: true } },
    },
  });
};

/**
 * Admin xóa mã coupon theo id.
 * Nếu không tìm thấy → NotFoundError.
 */
const deleteCoupon = async (id) => {
  const coupon = await prisma.coupon.findUnique({ where: { id } });
  if (!coupon) throw new NotFoundError('Coupon');

  await prisma.coupon.delete({ where: { id } });
};

/**
 * Admin bật/tắt trạng thái active của coupon.
 * Toggle: true → false, false → true.
 */
const toggleCouponActive = async (id) => {
  const coupon = await prisma.coupon.findUnique({ where: { id } });
  if (!coupon) throw new NotFoundError('Coupon');

  return prisma.coupon.update({
    where: { id },
    data: { isActive: !coupon.isActive },
  });
};

module.exports = {
  validateCoupon,
  formatCouponRuleDescription,
  createCoupon,
  listCoupons,
  deleteCoupon,
  toggleCouponActive,
  _calcDiscountAmount, // exported cho order.service dùng lại
};
