const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const notificationController = require('../controllers/notification.controller');
const { protect } = require('../middleware/auth');
const { adminProtect } = require('../middleware/adminAuth');

// Limiter riêng cho Pusher auth — Pusher gọi endpoint này mỗi khi reconnect/subscribe
const pusherAuthLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 phút
  max: 60, // 60 req/phút — Pusher có thể gọi nhiều lần khi reconnect
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    code: 'TOO_MANY_REQUESTS',
    message: 'Quá nhiều yêu cầu xác thực. Vui lòng thử lại.',
  },
});

// Pusher auth — không dùng protectUserOrAdmin vì user có thể có cả access_token lẫn admin_access_token
// Cần tự verify token để lấy đúng userId dựa trên channel_name
router.post('/auth', pusherAuthLimiter, notificationController.authenticatePusher);

const protectUserOrAdmin = (req, res, next) => {
  if (req.cookies['access_token']) {
    return protect(req, res, next);
  }
  if (req.cookies['admin_access_token']) {
    return adminProtect(req, res, next);
  }
  return res.status(401).json({ success: false, message: 'Not authenticated' });
};

router.use(protectUserOrAdmin);

router.get('/', notificationController.getNotifications);
router.get('/unread-count', notificationController.getUnreadCount);
router.patch('/:id/read', notificationController.markOneAsRead);
router.patch('/read-all', notificationController.markAllAsRead);

module.exports = router;
