const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../utils/cloudinary');

const allowedFormats = ['jpg', 'png', 'webp'];

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'products',
    allowed_formats: allowedFormats,
    transformation: [{ width: 800, height: 800, crop: 'limit', quality: 'auto' }]
  },
});

const fileFilter = (req, file, cb) => {
  // Check the file format manually before feeding to Cloudinary to fail fast
  const ext = file.mimetype.split('/')[1];
  const isAllowed = allowedFormats.includes(ext) || file.mimetype === 'image/jpeg';
  
  if (isAllowed) {
    cb(null, true);
  } else {
    // Pass custom error to Multer
    cb(new multer.MulterError('INVALID_FILE_FORMAT'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  }
});

module.exports = upload;
