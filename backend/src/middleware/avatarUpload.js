const multer = require('multer');

/**
 * Multer config for avatar uploads.
 * Uses memory storage so we can stream the buffer directly to Cloudinary
 * with custom per-user folder/public_id logic.
 */
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    const err = new Error('Chỉ chấp nhận file ảnh JPG, PNG hoặc WebP.');
    err.statusCode = 400;
    cb(err, false);
  }
};

const avatarUpload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
});

module.exports = avatarUpload;
