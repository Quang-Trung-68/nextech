const paymentService = require('../services/payment.service');

const handleWebhook = async (req, res, next) => {
  const signature = req.headers['stripe-signature'];

  if (!signature) {
    return res.status(400).send('Webhook Error: Missing Stripe Signature');
  }

  // KHÔNG dùng try/catch ở đây để stripe nhận http lỗi nếu constructEvent fail
  // Nhưng Prompt yêu cầu "để error đi qua errorHandler nhưng vẫn đảm bảo Stripe nhận 200 khi thành công"
  // Nghĩa là nếu throw logic trong controller, ta không nên bọc try-catch, mà throw thẳng hoặc pass qua next (express async error handling)
  // Thực tế nếu lỗi xảy ra, global errorHandler sẽ biến nó thành 4xx/5xx code mà Stripe hiểu là failed.
  // Code dưới đây sử dụng try catch để dùng next(err), standard trên express:
  
  try {
    await paymentService.handleWebhookEvent(req.body, signature);
    res.status(200).json({ received: true });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  handleWebhook,
};
