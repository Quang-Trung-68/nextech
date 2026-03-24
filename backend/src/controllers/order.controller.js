const orderService = require('../services/order.service');

/**
 * POST /api/orders
 * Tạo đơn hàng từ Cart.
 * - COD: status=PROCESSING, không có clientSecret
 * - STRIPE: status=PENDING, trả về clientSecret
 */
const createOrder = async (req, res, next) => {
  try {
    const { shippingAddress, paymentMethod, couponCode, vatInvoiceRequested, vatBuyerType, vatBuyerName, vatBuyerAddress, vatBuyerEmail, vatBuyerCompany, vatBuyerTaxCode, vatBuyerCompanyAddress } = req.body;
    const orderData = { vatInvoiceRequested, vatBuyerType, vatBuyerName, vatBuyerAddress, vatBuyerEmail, vatBuyerCompany, vatBuyerTaxCode, vatBuyerCompanyAddress };
    const result = await orderService.createOrder(req.user.id, shippingAddress, paymentMethod, couponCode, orderData);
    res.status(201).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/orders
 * Xem lịch sử đơn hàng của chính mình (phân trang + filter status).
 */
const getMyOrders = async (req, res, next) => {
  try {
    const result = await orderService.getMyOrders(req.user.id, req.query);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/orders/:id
 * Xem chi tiết 1 đơn — chỉ xem được đơn của mình.
 */
const getOrderById = async (req, res, next) => {
  try {
    const order = await orderService.getOrderById(req.params.id, req.user.id, req.user.role);
    res.status(200).json({ success: true, order });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/orders/:id/cancel
 * User tự huỷ đơn. Chỉ cho phép khi PENDING hoặc PROCESSING.
 * Bắt buộc có reason (tối thiểu 10 ký tự).
 */
const cancelOrder = async (req, res, next) => {
  try {
    const result = await orderService.cancelOrder(req.params.id, req.user.id, req.body.reason);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

// ─── Admin Controllers ──────────────────────────────────────────────────────

/**
 * GET /api/admin/orders
 * Admin xem tất cả đơn hàng (phân trang + filter status/paymentStatus/userId + sort).
 */
const adminGetAllOrders = async (req, res, next) => {
  try {
    const result = await orderService.getAllOrders(req.query);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/orders/:id
 * Admin xem chi tiết bất kỳ đơn hàng nào.
 */
const adminGetOrderById = async (req, res, next) => {
  try {
    const order = await orderService.adminGetOrderById(req.params.id);
    res.status(200).json({ success: true, order });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/admin/orders/:id/status
 * Admin cập nhật trạng thái theo flow: PROCESSING → SHIPPED → DELIVERED.
 * Không được đi ngược, không được update đơn đã CANCELLED.
 */
const adminUpdateOrderStatus = async (req, res, next) => {
  try {
    const order = await orderService.adminUpdateOrderStatus(req.params.id, req.body.status);
    res.status(200).json({ success: true, order });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/orders/:orderId/reviewable-items
 * Trả về danh sách OrderItem kèm hasReviewed của đơn đã giao.
 */
const reviewableItems = async (req, res, next) => {
  try {
    const result = await orderService.getReviewableItems(req.params.orderId, req.user.id);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
  adminGetAllOrders,
  adminGetOrderById,
  adminUpdateOrderStatus,
  reviewableItems,
};
