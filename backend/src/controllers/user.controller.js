const prisma = require('../utils/prisma');
const cloudinary = require('../utils/cloudinary');
const streamifier = require('streamifier');

// ─── Profile ──────────────────────────────────────────────────────────────────

/**
 * PATCH /api/users/me
 * Update name and phone for the authenticated user.
 */
const updateProfile = async (req, res, next) => {
  try {
    const { name, phone } = req.body;

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { name, phone },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatar: true,
        role: true,
        isEmailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.status(200).json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/users/me/avatar
 * Upload avatar image to Cloudinary.
 * Expects multipart/form-data with field "avatar".
 */
const uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      const err = new Error('Vui lòng chọn ảnh để tải lên.');
      err.statusCode = 400;
      return next(err);
    }

    // Stream upload to Cloudinary
    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'ecommerce/avatars',
          public_id: `user_${req.user.id}`,
          overwrite: true,
          transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }],
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );
      streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
    });

    const avatarUrl = uploadResult.secure_url;

    await prisma.user.update({
      where: { id: req.user.id },
      data: { avatar: avatarUrl },
    });

    res.status(200).json({ success: true, avatarUrl });
  } catch (error) {
    next(error);
  }
};

// ─── Addresses ────────────────────────────────────────────────────────────────

/**
 * GET /api/users/me/addresses
 */
const getAddresses = async (req, res, next) => {
  try {
    const addresses = await prisma.address.findMany({
      where: { userId: req.user.id },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
    res.status(200).json({ success: true, addresses });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/users/me/addresses
 */
const createAddress = async (req, res, next) => {
  try {
    const { fullName, phone, address, city, isDefault = false } = req.body;

    // Giới hạn 5 địa chỉ
    const count = await prisma.address.count({ where: { userId: req.user.id } });
    if (count >= 5) {
      const err = new Error('Bạn đã đạt giới hạn tối đa 5 địa chỉ.');
      err.statusCode = 400;
      return next(err);
    }

    // Nếu đặt làm mặc định, bỏ mặc định cũ
    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId: req.user.id, isDefault: true },
        data: { isDefault: false },
      });
    }

    // Nếu chưa có địa chỉ nào → tự động đặt làm mặc định
    const shouldBeDefault = isDefault || count === 0;

    const newAddress = await prisma.address.create({
      data: {
        userId: req.user.id,
        fullName,
        phone,
        address,
        city,
        isDefault: shouldBeDefault,
      },
    });

    res.status(201).json({ success: true, address: newAddress });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/users/me/addresses/:id
 */
const updateAddress = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { fullName, phone, address, city, isDefault } = req.body;

    const existing = await prisma.address.findFirst({
      where: { id, userId: req.user.id },
    });
    if (!existing) {
      const err = new Error('Địa chỉ không tồn tại.');
      err.statusCode = 404;
      return next(err);
    }

    if (isDefault && !existing.isDefault) {
      await prisma.address.updateMany({
        where: { userId: req.user.id, isDefault: true },
        data: { isDefault: false },
      });
    }

    const updated = await prisma.address.update({
      where: { id },
      data: { fullName, phone, address, city, isDefault: isDefault ?? existing.isDefault },
    });

    res.status(200).json({ success: true, address: updated });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/users/me/addresses/:id
 */
const deleteAddress = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existing = await prisma.address.findFirst({
      where: { id, userId: req.user.id },
    });
    if (!existing) {
      const err = new Error('Địa chỉ không tồn tại.');
      err.statusCode = 404;
      return next(err);
    }

    await prisma.address.delete({ where: { id } });

    // Nếu xoá địa chỉ mặc định và còn địa chỉ khác → tự đặt địa chỉ đầu tiên làm mặc định
    if (existing.isDefault) {
      const first = await prisma.address.findFirst({
        where: { userId: req.user.id },
        orderBy: { createdAt: 'asc' },
      });
      if (first) {
        await prisma.address.update({
          where: { id: first.id },
          data: { isDefault: true },
        });
      }
    }

    res.status(200).json({ success: true, message: 'Đã xoá địa chỉ.' });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/users/me/addresses/:id/default
 */
const setDefaultAddress = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existing = await prisma.address.findFirst({
      where: { id, userId: req.user.id },
    });
    if (!existing) {
      const err = new Error('Địa chỉ không tồn tại.');
      err.statusCode = 404;
      return next(err);
    }

    // Clear existing default
    await prisma.address.updateMany({
      where: { userId: req.user.id, isDefault: true },
      data: { isDefault: false },
    });

    const updated = await prisma.address.update({
      where: { id },
      data: { isDefault: true },
    });

    res.status(200).json({ success: true, address: updated });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  updateProfile,
  uploadAvatar,
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
};
