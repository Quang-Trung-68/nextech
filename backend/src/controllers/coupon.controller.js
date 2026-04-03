const couponService = require('../services/coupon.service');
const { formatCouponRuleDescription } = couponService;

// ─── User: Validate coupon ────────────────────────────────────────────────────

/**
 * POST /api/coupons/validate
 * User validate mã coupon trước khi tạo đơn.
 * Trả về discountAmount và couponId để frontend gửi kèm khi checkout.
 *
 * Body: { code, orderAmount }
 * Requires: protect middleware (req.user)
 */
const validateCoupon = async (req, res, next) => {
  try {
    const { code, orderAmount } = req.body;
    const userId = req.user.id;

    const { coupon, discountAmount } = await couponService.validateCoupon({ code, userId, orderAmount });

    res.status(200).json({
      success: true,
      message: `Áp dụng mã thành công! Bạn được giảm ${discountAmount.toLocaleString('vi-VN')}đ`,
      couponId: coupon.id,
      discountAmount,
      couponMeta: {
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        maxDiscountAmount: coupon.maxDiscountAmount,
        minOrderAmount: coupon.minOrderAmount,
        description: formatCouponRuleDescription(coupon),
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Admin: CRUD ──────────────────────────────────────────────────────────────

/**
 * POST /api/coupons
 * Admin tạo mã giảm giá mới.
 */
const createCoupon = async (req, res, next) => {
  try {
    const coupon = await couponService.createCoupon(req.body);
    res.status(201).json({ success: true, coupon });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/coupons
 * Admin xem danh sách tất cả mã giảm giá.
 */
const listCoupons = async (req, res, next) => {
  try {
    const coupons = await couponService.listCoupons();
    res.status(200).json({ success: true, coupons });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/coupons/:id
 * Admin xóa mã giảm giá.
 */
const deleteCoupon = async (req, res, next) => {
  try {
    await couponService.deleteCoupon(Number(req.params.id));
    res.status(200).json({ success: true, message: 'Xóa mã giảm giá thành công' });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/coupons/:id/toggle
 * Admin bật/tắt trạng thái active của mã giảm giá.
 */
const toggleCouponActive = async (req, res, next) => {
  try {
    const coupon = await couponService.toggleCouponActive(Number(req.params.id));
    res.status(200).json({
      success: true,
      message: `Mã giảm giá đã được ${coupon.isActive ? 'bật' : 'tắt'}`,
      coupon,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  validateCoupon,
  createCoupon,
  listCoupons,
  deleteCoupon,
  toggleCouponActive,
};
