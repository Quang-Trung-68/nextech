const notificationService = require('../services/notification.service');
const pusher = require('../lib/pusher');
const { verifyAccessToken } = require('../utils/jwt');
const prisma = require('../utils/prisma');

class NotificationController {
  authenticatePusher = async (req, res) => {
    try {
      const socketId = req.body.socket_id;
      const channelName = req.body.channel_name;

      const userToken = req.cookies['access_token'];
      const adminToken = req.cookies['admin_access_token'];

      // Thử lần lượt user token rồi admin token cho đến khi tìm được token hợp lệ
      const tokens = [
        { token: userToken, getUserId: (p) => p.userId, getRole: (p) => p.role || 'USER' },
        { token: adminToken, getUserId: (p) => p.adminId, getRole: () => 'ADMIN' },
      ];

      for (const { token, getUserId, getRole } of tokens) {
        if (!token) continue;
        try {
          const payload = verifyAccessToken(token);
          const userId = getUserId(payload);
          const role = getRole(payload);

          const isUserChannel = channelName === `private-user.${userId}`;
          const isAdminChannel = channelName === 'private-admin' && role === 'ADMIN';

          if (isUserChannel || isAdminChannel) {
            const authResponse = pusher.authorizeChannel(socketId, channelName);
            return res.json(authResponse);
          }
        } catch {}
      }

      return res.status(403).json({ message: 'Forbidden' });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Auth failed' });
    }
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
