/**
 * route.config.js
 * Cấu hình route tập trung cho backend NexTech.
 * Định nghĩa toàn bộ API route mapping và các tuỳ chọn đặc biệt.
 * server.js đọc file này và mount route trong một vòng lặp gọn gàng.
 */

const express = require('express');
const paymentController = require('../controllers/payment.controller');

/**
 * SPECIAL ROUTES
 * Các route cần middleware đặc biệt (ví dụ: raw body parser cho Stripe webhook).
 * Phải được mount TRƯỚC express.json() trong server.js.
 * Mỗi entry: { method, path, middlewares[], handler }
 */
const specialRoutes = [
  {
    method: 'post',
    path: '/api/payments/webhook',
    // ⚠️ Stripe yêu cầu raw Buffer body để verify signature — phải dùng express.raw()
    // PHẢI mount trước express.json() trong server.js
    middlewares: [express.raw({ type: 'application/json' })],
    handler: paymentController.handleWebhook,
  },
];

/**
 * API ROUTES
 * Các route thông thường, mount sau global middleware.
 * Thứ tự quan trọng — path cụ thể hơn (vd: /api/admin/orders)
 * phải đứng TRƯỚC prefix rộng hơn (vd: /api/admin).
 */
const apiRoutes = [
  { prefix: '/api/auth',         router: require('../routes/auth.routes') },
  { prefix: '/api/users',        router: require('../routes/user.routes') },
  { prefix: '/api/products',     router: require('../routes/product.routes') },
  { prefix: '/api/cart',         router: require('../routes/cart.routes') },
  { prefix: '/api/orders',       router: require('../routes/order.routes') },
  { prefix: '/api/admin/orders', router: require('../routes/admin.order.routes') },
  { prefix: '/api/admin/invoices', router: require('../routes/invoice.routes') },
  { prefix: '/api/admin/settings', router: require('../routes/settings.routes') },
  { prefix: '/api/admin',        router: require('../routes/admin.routes') },       // Stats, Products, Users
  { prefix: '/api/payments',     router: require('../routes/payment.routes') }, // GET intent/status
  { prefix: '/api/favorites',    router: require('../routes/favorite.routes') },
  { prefix: '/api/coupons',      router: require('../routes/coupon.routes') },
];

module.exports = { specialRoutes, apiRoutes };
