const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const { protect } = require('../middleware/auth');

// POST /api/payments/webhook
// Không cần JWT — raw Buffer body, Stripe tự verify với signature
// Đây là route duy nhất mount cùng với express.raw() tại server.js
router.post('/', paymentController.handleWebhook);

// GET /api/payments/intent/:orderId
// Frontend gọi để lấy clientSecret trước khi mount Stripe Elements
// Cần đăng nhập — chỉ trả về nếu order thuộc user đang login
router.get('/intent/:orderId', protect, paymentController.getOrderPaymentIntent);

// GET /api/payments/status/:orderId
// Frontend polling sau khi stripe.confirmCardPayment() để biết DB đã update chưa
// Webhook update DB bất đồng bộ nên cần endpoint này
router.get('/status/:orderId', protect, paymentController.getOrderPaymentStatus);

module.exports = router;
