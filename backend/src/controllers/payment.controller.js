const paymentService = require('../services/payment.service');
const { AppError } = require('../errors/AppError');
const ERROR_CODES = require('../errors/errorCodes');

/**
 * POST /api/payments/webhook
 * Stripe gọi endpoint này sau mỗi sự kiện (payment succeeded/failed).
 * Yêu cầu raw Buffer body — mount express.raw() tại server.js.
 * KHÔNG cần JWT — Stripe tự xác thực bằng signature header.
 */
const handleWebhook = async (req, res, next) => {
  const signature = req.headers['stripe-signature'];

  if (!signature) {
    return next(new AppError('Missing Stripe-Signature header.', 400, ERROR_CODES.PAYMENT.STRIPE_WEBHOOK_INVALID));
  }

  try {
    await paymentService.handleWebhookEvent(req.body, signature);
    res.status(200).json({ received: true });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/payments/sepay/webhook
 * IPN Hook for SePay VietQR (Server-to-Server)
 */
const handleSepayWebhook = async (req, res, next) => {
  try {
    await paymentService.handleSepayWebhookEvent(req.body);
    res.status(200).json({ success: true });
  } catch (err) {
    console.error('[SePay Webhook Error]', err);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

/**
 * GET /api/payments/intent/:orderId
 * Frontend dùng để lấy clientSecret trước khi mount Stripe Elements / Card.
 * Chỉ trả về nếu order thuộc user đang đăng nhập và chưa PAID.
 *
 * Response: { success, data: { orderId, clientSecret, totalAmount, paymentStatus } }
 */
const getOrderPaymentIntent = async (req, res, next) => {
  try {
    const data = await paymentService.getOrderPaymentIntent(req.params.orderId, req.user.id);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/payments/status/:orderId
 * Frontend polling sau khi stripe.confirmCardPayment() hoàn tất.
 * Webhook cập nhật DB bất đồng bộ — endpoint này cho phép frontend biết kết quả.
 *
 * Response: { success, data: { orderId, status, paymentStatus, isPaid } }
 */
const getOrderPaymentStatus = async (req, res, next) => {
  try {
    const data = await paymentService.getOrderPaymentStatus(req.params.orderId, req.user.id);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  handleWebhook,
  getOrderPaymentIntent,
  getOrderPaymentStatus,
  handleSepayWebhook,
};

