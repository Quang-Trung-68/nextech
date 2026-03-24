const prisma = require('../utils/prisma');
const pusher = require('../lib/pusher');

class NotificationService {
  async createAndSend(userId, type, title, message, data = {}) {
    // Nếu userId là null, đây có thể là logic cho admin broadcast, nhưng schema yêu cầu \`userId\` String.
    // Tạm thời coi userId null là không lưu database, hoặc người dùng sẽ lưu vào từng admin.
    // Theo yêu cầu: "Nếu userId là null -> push private-admin" (mặc dù schema bắt userId)
    // Nhưng user yêu cầu loop admin và lưu từng cái: 
    // "Lấy tất cả userId có role ADMIN từ DB, gửi cho từng admin" => Nên userId không null khi lưu.
    
    // Tạo bản ghi trong DB
    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        data,
      },
    });

    // Push qua Soketi/Pusher
    const channel = `private-user.${userId}`;
    await pusher.trigger(channel, 'notification.new', notification);

    return notification;
  }

  async getNotifications(userId, cursor, limit = 10) {
    const take = parseInt(limit) || 10;
    
    const query = {
      where: { userId },
      take: take + 1,
      orderBy: { createdAt: 'desc' },
    };

    if (cursor) {
      query.cursor = { id: cursor };
    }

    const notifications = await prisma.notification.findMany(query);

    let nextCursor = null;
    if (notifications.length > take) {
      const nextItem = notifications.pop();
      nextCursor = nextItem.id;
    }

    return { notifications, nextCursor };
  }

  async getUnreadCount(userId) {
    const count = await prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });
    return count;
  }

  async markOneAsRead(notificationId, userId) {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification || notification.userId !== userId) {
      throw new Error('Notification not found or unauthorized');
    }

    return prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId) {
    return prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });
  }
}

module.exports = new NotificationService();
