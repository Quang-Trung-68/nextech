const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const { protect, restrictTo } = require('../middleware/auth');
const { validate } = require('../middleware/validateRequest');
const {
  adminUpdateOrderStatusSchema,
  adminListOrdersQuerySchema,
  orderParamsSchema,
} = require('../validations/order.validation');

// Tất cả route tại đây đều yêu cầu đăng nhập + role ADMIN
router.use(protect, restrictTo('ADMIN'));

// GET /api/admin/orders — Xem tất cả đơn hàng, filter + sort + phân trang
router.get(
  '/',
  validate(adminListOrdersQuerySchema, 'query'),
  orderController.adminGetAllOrders
);

// GET /api/admin/orders/:id — Chi tiết bất kỳ đơn nào
router.get(
  '/:id',
  validate(orderParamsSchema, 'params'),
  orderController.adminGetOrderById
);

// PATCH /api/admin/orders/:id/status — Cập nhật status theo flow: PROCESSING→SHIPPED→DELIVERED
router.patch(
  '/:id/status',
  validate(orderParamsSchema, 'params'),
  validate(adminUpdateOrderStatusSchema),
  orderController.adminUpdateOrderStatus
);

const AdminInvoiceController = require('../controllers/invoice.controller');

// GET /api/admin/orders/:orderId/invoice — Lấy invoice của một order
router.get(
  '/:orderId/invoice',
  AdminInvoiceController.getByOrderId
);

// POST /api/admin/orders/:orderId/invoice — Tạo invoice thủ công từ admin
router.post(
  '/:orderId/invoice',
  AdminInvoiceController.createManual
);
module.exports = router;
