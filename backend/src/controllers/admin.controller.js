const statsService = require('../services/stats.service');
const adminProductService = require('../services/adminProduct.service');
const adminUserService = require('../services/adminUser.service');
const { AppError } = require('../errors/AppError');
const ERROR_CODES = require('../errors/errorCodes');

// ─── Stats ────────────────────────────────────────────────────────────────────

const getOverviewStats = async (req, res, next) => {
  try {
    const data = await statsService.getOverviewStats(req.query.period);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const getRevenueStats = async (req, res, next) => {
  try {
    const { year, month } = req.query;
    const data = await statsService.getRevenueStats(year, month);
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

const regenerateProductSlug = async (req, res, next) => {
  try {
    const product = await adminProductService.regenerateProductSlug(req.params.id);
    res.status(200).json({ success: true, product });
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

const cloudinary = require('../utils/cloudinary');

const uploadImages = async (req, res, next) => {
  try {
    // req.cloudinaryFiles được set bởi uploadToCloudinary middleware
    const cloudinaryFiles = req.cloudinaryFiles;
    if (!cloudinaryFiles || cloudinaryFiles.length === 0) {
      return next(new AppError('No images uploaded', 400, ERROR_CODES.MEDIA.IMAGE_UPLOAD_FAILED));
    }
    // cloudinaryFiles = [{ url, publicId }] - đã được upload lên Cloudinary
    res.status(200).json({ success: true, images: cloudinaryFiles });
  } catch (err) {
    next(err);
  }
};

const deleteImage = async (req, res, next) => {
  try {
    // publicId might be passed in body or encoded in params
    const publicId = req.params.publicId || req.body.publicId; 
    if (!publicId) {
      return next(new AppError('Missing publicId', 400, ERROR_CODES.SERVER.VALIDATION_ERROR));
    }
    await cloudinary.uploader.destroy(publicId);
    res.status(200).json({ success: true, message: 'Image deleted from Cloudinary' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getOverviewStats,
  getRevenueStats,
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  regenerateProductSlug,
  getUsers,
  getUserById,
  toggleUserStatus,
  uploadImages,
  deleteImage,
};
