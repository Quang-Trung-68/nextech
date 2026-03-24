const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const { protect, requireEmailVerified, restrictTo } = require('../middleware/auth');
const { validate } = require('../middleware/validateRequest');
const {
  createOrderSchema,
  cancelOrderSchema,
  listMyOrdersQuerySchema,
  orderParamsSchema,
} = require('../validations/order.validation');

// ─── User Routes (auth required) ─────────────────────────────────────────────

// POST /api/orders — Tạo đơn từ Cart (COD hoặc STRIPE)
router.post(
  '/',
  protect,
  validate(createOrderSchema),
  orderController.createOrder
);

// GET /api/orders — Lịch sử đơn của mình, filter + phân trang
router.get(
  '/',
  protect,
  validate(listMyOrdersQuerySchema, 'query'),
  orderController.getMyOrders
);

// GET /api/orders/:id — Chi tiết 1 đơn (chỉ của mình)
router.get(
  '/:id',
  protect,
  validate(orderParamsSchema, 'params'),
  orderController.getOrderById
);

// PATCH /api/orders/:id/cancel — Tự huỷ đơn (chỉ PENDING/PROCESSING)
router.patch(
  '/:id/cancel',
  protect,
  validate(orderParamsSchema, 'params'),
  validate(cancelOrderSchema),
  orderController.cancelOrder
);

// GET /api/orders/:orderId/reviewable-items — Danh sách item có thể review
router.get(
  '/:orderId/reviewable-items',
  protect,
  requireEmailVerified,
  orderController.reviewableItems
);

// ─── Admin Routes ─────────────────────────────────────────────────────────────
// Mounted dưới /api/orders/admin/* — nhưng để tách rõ hơn, admin routes
// sẽ được mount riêng tại server.js (/api/admin/orders → admin.order.routes.js)

module.exports = router;
