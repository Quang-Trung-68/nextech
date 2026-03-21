const express = require('express');
const router = express.Router();

const couponController = require('../controllers/coupon.controller');
const { protect, restrictTo } = require('../middleware/auth');
const { validate } = require('../middleware/validateRequest');
const { validateCouponSchema, createCouponSchema } = require('../validations/coupon.validation');

// Admin-only shorthand
const adminOnly = [protect, restrictTo('ADMIN')];

// ─── User route ───────────────────────────────────────────────────────────────

/**
 * POST /api/coupons/validate
 * Validate mã coupon và trả về discountAmount trước khi checkout.
 * Yêu cầu đăng nhập để kiểm tra CouponUsage theo userId.
 */
router.post(
  '/validate',
  protect,
  validate(validateCouponSchema),
  couponController.validateCoupon
);

// ─── Admin routes ─────────────────────────────────────────────────────────────

/**
 * POST /api/coupons
 * Admin tạo mã giảm giá mới.
 */
router.post(
  '/',
  ...adminOnly,
  validate(createCouponSchema),
  couponController.createCoupon
);

/**
 * GET /api/coupons
 * Admin xem danh sách tất cả mã giảm giá.
 */
router.get('/', ...adminOnly, couponController.listCoupons);

/**
 * DELETE /api/coupons/:id
 * Admin xóa mã giảm giá.
 */
router.delete('/:id', ...adminOnly, couponController.deleteCoupon);

/**
 * PATCH /api/coupons/:id/toggle
 * Admin bật/tắt trạng thái active của mã.
 */
router.patch('/:id/toggle', ...adminOnly, couponController.toggleCouponActive);

module.exports = router;

