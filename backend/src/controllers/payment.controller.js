const paymentService = require('../services/payment.service');

/**
 * POST /api/payments/webhook
 * Stripe gọi endpoint này sau mỗi sự kiện (payment succeeded/failed).
 * Yêu cầu raw Buffer body — mount express.raw() tại server.js.
 * KHÔNG cần JWT — Stripe tự xác thực bằng signature header.
 */
const handleWebhook = async (req, res, next) => {
  const signature = req.headers['stripe-signature'];

  if (!signature) {
    return res.status(400).json({ success: false, message: 'Missing Stripe-Signature header' });
  }

  try {
    await paymentService.handleWebhookEvent(req.body, signature);
    res.status(200).json({ received: true });
  } catch (err) {
    next(err);
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
};

