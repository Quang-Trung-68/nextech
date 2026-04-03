const cartService = require('../services/cart.service');

const getCart = async (req, res, next) => {
  try {
    const cart = await cartService.getCart(req.user.id);
    res.status(200).json({ success: true, data: cart });
  } catch (error) {
    next(error);
  }
};

const addToCart = async (req, res, next) => {
  try {
    const { productId, quantity, variantId } = req.body;
    const cart = await cartService.addToCart(req.user.id, productId, quantity, variantId ?? null);
    res.status(200).json({ success: true, data: cart });
  } catch (error) {
    next(error);
  }
};

const updateCartItem = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { quantity, variantId } = req.body;
    const cart = await cartService.updateCartItem(req.user.id, productId, quantity, variantId ?? null);
    res.status(200).json({ success: true, data: cart });
  } catch (error) {
    next(error);
  }
};

const removeFromCart = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const variantId = req.query.variantId || null;
    const cart = await cartService.removeFromCart(req.user.id, productId, variantId);
    res.status(200).json({ success: true, data: cart });
  } catch (error) {
    next(error);
  }
};

const clearCart = async (req, res, next) => {
  try {
    const result = await cartService.clearCart(req.user.id);
    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
};
