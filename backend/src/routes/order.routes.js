const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const { protect, restrictTo } = require('../middleware/auth');
const { validate } = require('../middleware/validateRequest');
const {
  createOrderSchema,
  updateOrderStatusSchema,
  orderParamsSchema,
} = require('../validations/order.validation');

router.post('/', protect, validate(createOrderSchema), orderController.createOrder);
router.get('/my', protect, orderController.getMyOrders);
router.get('/:id', protect, validate(orderParamsSchema, 'params'), orderController.getOrderById);
router.put('/:id/status', protect, restrictTo('ADMIN'), validate(orderParamsSchema, 'params'), validate(updateOrderStatusSchema), orderController.updateOrderStatus);

module.exports = router;
