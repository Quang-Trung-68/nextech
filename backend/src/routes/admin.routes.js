const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { protect, restrictTo } = require('../middleware/auth');
const { validate } = require('../middleware/validateRequest');
const {
  statsQuerySchema,
  adminProductQuerySchema,
  adminCreateProductSchema,
  adminUpdateProductSchema,
  adminProductParamsSchema,
  adminUserQuerySchema,
  adminUserParamsSchema,
  adminUserOrderQuerySchema,
} = require('../validations/admin.validation');

// Tất cả routes dưới đây đều yêu cầu đăng nhập + role ADMIN
router.use(protect, restrictTo('ADMIN'));

// ─── Stats ────────────────────────────────────────────────────────────────────

// GET /api/admin/stats/overview?period=day|week|month
router.get(
  '/stats/overview',
  validate(statsQuerySchema, 'query'),
  adminController.getOverviewStats
);

// ─── Products ─────────────────────────────────────────────────────────────────

// GET /api/admin/products
router.get(
  '/products',
  validate(adminProductQuerySchema, 'query'),
  adminController.getProducts
);

// GET /api/admin/products/:id
router.get(
  '/products/:id',
  validate(adminProductParamsSchema, 'params'),
  adminController.getProductById
);

// POST /api/admin/products
router.post(
  '/products',
  validate(adminCreateProductSchema),
  adminController.createProduct
);

// PATCH /api/admin/products/:id
router.patch(
  '/products/:id',
  validate(adminProductParamsSchema, 'params'),
  validate(adminUpdateProductSchema),
  adminController.updateProduct
);

// DELETE /api/admin/products/:id
router.delete(
  '/products/:id',
  validate(adminProductParamsSchema, 'params'),
  adminController.deleteProduct
);

// ─── Users ────────────────────────────────────────────────────────────────────

// GET /api/admin/users
router.get(
  '/users',
  validate(adminUserQuerySchema, 'query'),
  adminController.getUsers
);

// GET /api/admin/users/:id  (kèm phân trang đơn hàng qua query)
router.get(
  '/users/:id',
  validate(adminUserParamsSchema, 'params'),
  validate(adminUserOrderQuerySchema, 'query'),
  adminController.getUserById
);

// PATCH /api/admin/users/:id/toggle-status
router.patch(
  '/users/:id/toggle-status',
  validate(adminUserParamsSchema, 'params'),
  adminController.toggleUserStatus
);

module.exports = router;
