const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cart.controller');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validateRequest');
const {
  addToCartSchema,
  updateCartItemSchema,
  cartParamsSchema,
  cartItemQuerySchema,
} = require('../validations/cart.validation');

router.get('/', protect, cartController.getCart);
router.post('/items', protect, validate(addToCartSchema), cartController.addToCart);
router.put('/items/:productId', protect, validate(cartParamsSchema, 'params'), validate(updateCartItemSchema), cartController.updateCartItem);
router.delete(
  '/items/:productId',
  protect,
  validate(cartParamsSchema, 'params'),
  validate(cartItemQuerySchema, 'query'),
  cartController.removeFromCart
);
router.delete('/', protect, cartController.clearCart);

module.exports = router;
