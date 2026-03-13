const statsService = require('../services/stats.service');
const adminProductService = require('../services/adminProduct.service');
const adminUserService = require('../services/adminUser.service');

// ─── Stats ────────────────────────────────────────────────────────────────────

const getOverviewStats = async (req, res, next) => {
  try {
    const data = await statsService.getOverviewStats(req.query.period);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

// ─── Admin Products ───────────────────────────────────────────────────────────

const getProducts = async (req, res, next) => {
  try {
    const result = await adminProductService.getProducts(req.query);
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

const getProductById = async (req, res, next) => {
  try {
    const product = await adminProductService.getProductById(req.params.id);
    res.status(200).json({ success: true, product });
  } catch (err) {
    next(err);
  }
};

const createProduct = async (req, res, next) => {
  try {
    const product = await adminProductService.createProduct(req.body);
    res.status(201).json({ success: true, product });
  } catch (err) {
    next(err);
  }
};

const updateProduct = async (req, res, next) => {
  try {
    const product = await adminProductService.updateProduct(req.params.id, req.body);
    res.status(200).json({ success: true, product });
  } catch (err) {
    next(err);
  }
};

const deleteProduct = async (req, res, next) => {
  try {
    await adminProductService.deleteProduct(req.params.id);
    res.status(200).json({ success: true, message: 'Sản phẩm đã được xoá' });
  } catch (err) {
    next(err);
  }
};

// ─── Admin Users ──────────────────────────────────────────────────────────────

const getUsers = async (req, res, next) => {
  try {
    const result = await adminUserService.getUsers(req.query);
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

const getUserById = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const result = await adminUserService.getUserById(
      req.params.id,
      Number(page) || 1,
      Number(limit) || 10
    );
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

const toggleUserStatus = async (req, res, next) => {
  try {
    const result = await adminUserService.toggleUserStatus(req.params.id, req.user.id);
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getOverviewStats,
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getUsers,
  getUserById,
  toggleUserStatus,
};
