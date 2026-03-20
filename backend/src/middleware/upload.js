const multer = require('multer');
const cloudinary = require('../utils/cloudinary');

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

// Dùng memoryStorage để nhận file dưới dạng Buffer, sau đó tự upload lên Cloudinary
// (multer-storage-cloudinary@4 không tương thích với multer v2)
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

/**
 * Upload một buffer lên Cloudinary
 * @param {Buffer} buffer - File buffer từ multer.memoryStorage()
 * @param {string} mimetype - MIME type của file
 * @param {object} options  - Cloudinary upload options
 * @returns {Promise<{url: string, publicId: string}>}
 */
const uploadBufferToCloudinary = async (buffer, mimetype, options = {}) => {
  const defaultOptions = {
    folder: 'products',
    transformation: [{ width: 800, height: 800, crop: 'limit', quality: 'auto' }],
    resource_type: 'image',
    timeout: 20000,
    ...options,
  };

  // Switch to data-URI upload which is far more reliable and avoids stream pausing/timeout bugs
  const b64 = buffer.toString('base64');
  const dataURI = `data:${mimetype};base64,${b64}`;

  const result = await cloudinary.uploader.upload(dataURI, defaultOptions);
  
  return {
    url: result.secure_url,
    publicId: result.public_id,
  };
};

/**
 * Upload tất cả files trong req.files lên Cloudinary sau khi multer đã nhận buffer
 * Gắn kết quả vào req.cloudinaryFiles = [{ url, publicId }]
 */
const uploadToCloudinary = async (req, res, next) => {
  if (!req.files || req.files.length === 0) {
    return next();
  }

  try {
    const uploadedImages = await Promise.all(
      req.files.map((file) =>
        uploadBufferToCloudinary(file.buffer, file.mimetype)
      )
    );
    req.cloudinaryFiles = uploadedImages;
    next();
  } catch (err) {
    // Không có gì để rollback vì đây là lần upload đầu tiên
    next(err);
  }
};

module.exports = upload;
module.exports.uploadToCloudinary = uploadToCloudinary;
module.exports.uploadBufferToCloudinary = uploadBufferToCloudinary;
