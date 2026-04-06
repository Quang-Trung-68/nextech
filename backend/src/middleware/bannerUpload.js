/**
 * Multer + Cloudinary for banner hero images.
 * Folder: nextech/banners
 */

const multer = require('multer');
const { uploadBufferToCloudinary } = require('./upload');

const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];

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

const bannerUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

/**
 * Uploads single "image" field to Cloudinary (nextech/banners).
 * Attaches req.cloudinarySingle = { url, publicId }
 */
const uploadBannerImage = async (req, res, next) => {
  if (!req.file) return next();
  try {
    const result = await uploadBufferToCloudinary(req.file.buffer, req.file.mimetype, {
      folder: 'nextech/banners',
      transformation: [{ width: 1920, height: 800, crop: 'limit', quality: 'auto' }],
    });
    req.cloudinarySingle = result;
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { bannerUpload, uploadBannerImage };
