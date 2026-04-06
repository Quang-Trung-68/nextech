const express = require('express');
const router = express.Router();
const bannerController = require('../controllers/banner.controller');
const { protect, restrictTo } = require('../middleware/auth');
const { validate } = require('../middleware/validateRequest');
const { bannerUpload, uploadBannerImage } = require('../middleware/bannerUpload');
const {
  createBannerSchema,
  updateBannerSchema,
  bannerIdParamsSchema,
} = require('../validations/banner.validation');

router.use(protect, restrictTo('ADMIN'));

const mergeBannerImage = (req, res, next) => {
  if (req.cloudinarySingle?.url) {
    req.body = { ...req.body, imageUrl: req.cloudinarySingle.url };
  }
  next();
};

router.get('/', bannerController.getAllBannersAdmin);

router.post(
  '/upload-image',
  bannerUpload.single('image'),
  uploadBannerImage,
  bannerController.uploadBannerImageOnly
);

router.post(
  '/',
  bannerUpload.single('image'),
  uploadBannerImage,
  mergeBannerImage,
  validate(createBannerSchema),
  bannerController.createBanner
);

router.put(
  '/:id',
  validate(bannerIdParamsSchema, 'params'),
  bannerUpload.single('image'),
  uploadBannerImage,
  mergeBannerImage,
  validate(updateBannerSchema),
  bannerController.updateBanner
);

router.delete(
  '/:id',
  validate(bannerIdParamsSchema, 'params'),
  bannerController.deleteBanner
);

router.patch(
  '/:id/toggle',
  validate(bannerIdParamsSchema, 'params'),
  bannerController.toggleBannerActive
);

module.exports = router;
