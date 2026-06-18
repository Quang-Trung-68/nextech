const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const notificationController = require('../controllers/notification.controller');
const { protect } = require('../middleware/auth');
const { adminProtect } = require('../middleware/adminAuth');

const protectUserOrAdmin = (req, res, next) => {
  if (req.cookies['admin_access_token']) {
    return adminProtect(req, res, next);
  }
  return protect(req, res, next);
};

router.use(protectUserOrAdmin);

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

router.post('/auth', pusherAuthLimiter, notificationController.authenticatePusher);
router.get('/', notificationController.getNotifications);
router.get('/unread-count', notificationController.getUnreadCount);
router.patch('/:id/read', notificationController.markOneAsRead);
router.patch('/read-all', notificationController.markAllAsRead);

module.exports = router;
