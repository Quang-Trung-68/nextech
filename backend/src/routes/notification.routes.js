const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification.controller');
const { protect } = require('../middleware/auth');

router.use(protect);

router.post('/auth', notificationController.authenticatePusher);
router.get('/', notificationController.getNotifications);
router.get('/unread-count', notificationController.getUnreadCount);
router.patch('/:id/read', notificationController.markOneAsRead);
router.patch('/read-all', notificationController.markAllAsRead);

module.exports = router;
