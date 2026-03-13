const orderService = require('../services/order.service');

const createOrder = async (req, res, next) => {
  try {
    const { shippingAddress, paymentMethod } = req.body;
    const result = await orderService.createOrder(req.user.id, shippingAddress, paymentMethod);
    res.status(201).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

const getMyOrders = async (req, res, next) => {
  try {
    const orders = await orderService.getMyOrders(req.user.id);
    res.status(200).json({ success: true, orders });
  } catch (error) {
    next(error);
  }
};

const getOrderById = async (req, res, next) => {
  try {
    const order = await orderService.getOrderById(req.params.id, req.user.id, req.user.role);
    res.status(200).json({ success: true, order });
  } catch (error) {
    next(error);
  }
};

const updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const order = await orderService.updateOrderStatus(req.params.id, status);
    res.status(200).json({ success: true, order });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  updateOrderStatus,
};
