/**
 * Multer + Cloudinary cho logo thương hiệu (admin).
 * Folder: nextech/brands
 */

const multer = require('multer');
const { uploadBufferToCloudinary } = require('./upload');

const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];

const fileFilter = (req, file, cb) => {
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    const err = new multer.MulterError('LIMIT_UNEXPECTED_FILE', file.fieldname);
    err.code = 'INVALID_FILE_FORMAT';
    err.message = 'INVALID_FILE_FORMAT';
    cb(err, false);
  }
};

const brandUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: 3 * 1024 * 1024 },
});

/**
 * Upload field "logo" → req.cloudinarySingle = { url, publicId }
 */
const uploadBrandLogo = async (req, res, next) => {
  if (!req.file) return next();
  try {
    const isSvg = req.file.mimetype === 'image/svg+xml';
    const result = await uploadBufferToCloudinary(req.file.buffer, req.file.mimetype, {
      folder: 'nextech/brands',
      ...(isSvg
        ? {}
        : { transformation: [{ width: 512, height: 512, crop: 'limit', quality: 'auto' }] }),
    });
    req.cloudinarySingle = result;
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { brandUpload, uploadBrandLogo };
