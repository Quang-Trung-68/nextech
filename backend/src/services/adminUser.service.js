const prisma = require('../utils/prisma');

const { AppError, NotFoundError, ConflictError } = require('../errors/AppError');
const ERROR_CODES = require('../errors/errorCodes');

const USER_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
};

/**
 * Admin: Danh sách users với phân trang + filter
 */
const getUsers = async ({ role, isActive, sortBy, sortOrder, page, limit, search }) => {
  const where = {};
  if (role !== undefined) where.role = role;
  if (isActive !== undefined) where.isActive = isActive;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }

  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        ...USER_SELECT,
        _count: { select: { orders: true } },
      },
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  return {
    users,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
};

/**
 * Admin: Chi tiết 1 user + lịch sử đơn hàng (phân trang)
 */
const getUserById = async (userId, orderPage = 1, orderLimit = 10) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: USER_SELECT,
  });

  if (!user) throw new NotFoundError('User');

  const orderSkip = (orderPage - 1) * orderLimit;

  const [orders, totalOrders] = await Promise.all([
    prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip: orderSkip,
      take: orderLimit,
      include: {
        orderItems: {
          include: { product: { select: { id: true, name: true } } },
        },
      },
    }),
    prisma.order.count({ where: { userId } }),
  ]);

  return {
    user,
    orders,
    orderPagination: {
      total: totalOrders,
      page: orderPage,
      limit: orderLimit,
      totalPages: Math.ceil(totalOrders / orderLimit),
    },
  };
};

/**
 * Admin: Toggle isActive — không được khoá chính mình.
 * Khi khoá: revoke toàn bộ RefreshToken trong cùng $transaction
 * để user không thể lấy Access Token mới qua /api/auth/refresh.
 */
const toggleUserStatus = async (targetUserId, requestingAdminId) => {
  if (targetUserId === requestingAdminId) {
    throw new ConflictError('Cannot lock your own account', 'CONFLICT');
  }

  const user = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: USER_SELECT,
  });

  if (!user) throw new NotFoundError('User');

  const newIsActive = !user.isActive;

  // Khi khoá (false): xoá toàn bộ RefreshToken trong cùng transaction
  // → user không thể dùng /auth/refresh để lấy Access Token mới nữa
  // Khi mở khoá (true): không cần làm gì thêm với token
  const ops = [
    prisma.user.update({
      where: { id: targetUserId },
      data: { isActive: newIsActive },
      select: USER_SELECT,
    }),
  ];

  if (!newIsActive) {
    ops.push(prisma.refreshToken.deleteMany({ where: { userId: targetUserId } }));
  }

  const [updated] = await prisma.$transaction(ops);

  return {
    user: updated,
    action: updated.isActive ? 'unlocked' : 'locked',
    message: updated.isActive
      ? `Account ${updated.email} has been unlocked`
      : `Account ${updated.email} has been locked and all sessions have been revoked`,
  };
};

module.exports = { getUsers, getUserById, toggleUserStatus };
