const rateLimit = require('express-rate-limit');

/**
 * Bộ giới hạn mặc định cho toàn bộ các API công khai khác (300 reqs / 15 phút)
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 300, // Tối đa 300 requests mỗi IP (tăng từ 100 để tránh 429 với Pusher auth + SePay sync)
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    code: 'TOO_MANY_REQUESTS',
    message: 'Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau 15 phút.',
  },
});

/**
 * Bộ giới hạn chuyên biệt cho các thao tác đăng nhập, đăng ký, quên mật khẩu (15 reqs / 15 phút)
 * Giúp chống Brute Force tài khoản cực kỳ hiệu quả
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 15, // Tối đa 15 requests mỗi IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    code: 'AUTH_TOO_MANY_REQUESTS',
    message: 'Bạn đã thực hiện quá nhiều thao tác xác thực liên tiếp. Vui lòng thử lại sau 15 phút.',
  },
});

/**
 * Bộ giới hạn nghiêm ngặt cho Chatbot AI (10 câu hỏi / 1 phút)
 * Nới từ 5 lên 10 để trải nghiệm mượt hơn
 */
const aiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 phút
  max: 10, // Tối đa 10 câu hỏi mỗi phút trên mỗi IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    code: 'AI_CHAT_TOO_MANY_REQUESTS',
    message: 'Bạn đang gửi tin nhắn quá nhanh với trợ lý AI. Vui lòng đợi 1 phút trước khi gửi tiếp.',
  },
});

module.exports = {
  apiLimiter,
  authLimiter,
  aiLimiter,
};
