const notificationService = require('../services/notification.service');
const pusher = require('../lib/pusher');

class NotificationController {
  authenticatePusher = (req, res) => {
    const socketId = req.body.socket_id;
    const channelName = req.body.channel_name;
    const userId = req.user.id;

    const isUserChannel = channelName === `private-user.${userId}`;
    const isAdminChannel = channelName === 'private-admin' && req.user.role === 'ADMIN';

    if (!isUserChannel && !isAdminChannel) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const authResponse = pusher.authorizeChannel(socketId, channelName);
    return res.json(authResponse);
  };

  getNotifications = async (req, res, next) => {
    try {
      const { cursor, limit } = req.query;
      const result = await notificationService.getNotifications(req.user.id, cursor, limit);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  getUnreadCount = async (req, res, next) => {
    try {
      const count = await notificationService.getUnreadCount(req.user.id);
      res.json({ count });
    } catch (error) {
      next(error);
    }
  };

  markOneAsRead = async (req, res, next) => {
    try {
      const { id } = req.params;
      const notification = await notificationService.markOneAsRead(id, req.user.id);
      res.json(notification);
    } catch (error) {
      next(error);
    }
  };

  markAllAsRead = async (req, res, next) => {
    try {
      await notificationService.markAllAsRead(req.user.id);
      res.json({ message: 'Tất cả thông báo đã được đánh dấu đã đọc' });
    } catch (error) {
      next(error);
    }
  };
}

module.exports = new NotificationController();
