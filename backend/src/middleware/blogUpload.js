/**
 * blogUpload.js
 * Multer + Cloudinary upload middleware for blog cover images.
 * Reuses the shared uploadBufferToCloudinary utility from upload.js.
 * Stores images in Cloudinary folder: nextech/blog
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

const blogUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

/**
 * Express middleware: uploads a single "coverImage" field to Cloudinary (nextech/blog).
 * Attaches result to req.cloudinarySingle = { url, publicId }
 * Passes through if no file uploaded.
 */
const uploadBlogCover = async (req, res, next) => {
  if (!req.file) return next();
  try {
    const result = await uploadBufferToCloudinary(req.file.buffer, req.file.mimetype, {
      folder: 'nextech/blog',
      transformation: [{ width: 1200, height: 630, crop: 'limit', quality: 'auto' }],
    });
    req.cloudinarySingle = result;
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { blogUpload, uploadBlogCover };
