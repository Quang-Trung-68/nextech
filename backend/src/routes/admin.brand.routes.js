const express = require('express');
const router = express.Router();
const adminBrandController = require('../controllers/adminBrand.controller');
const { protect, restrictTo } = require('../middleware/auth');
const { validate } = require('../middleware/validateRequest');
const { brandUpload, uploadBrandLogo } = require('../middleware/brandUpload');
const {
  createBrandSchema,
  updateBrandSchema,
  brandIdParamsSchema,
} = require('../validations/adminBrand.validation');

router.use(protect, restrictTo('ADMIN'));

const mergeLogo = (req, res, next) => {
  if (req.cloudinarySingle?.url) {
    req.body = { ...req.body, logo: req.cloudinarySingle.url };
  }
  next();
};

router.get('/', adminBrandController.listBrands);

router.post(
  '/upload-logo',
  brandUpload.single('logo'),
  uploadBrandLogo,
  adminBrandController.uploadLogoOnly
);

router.post(
  '/',
  brandUpload.single('logo'),
  uploadBrandLogo,
  mergeLogo,
  validate(createBrandSchema),
  adminBrandController.createBrand
);

router.get('/:id', validate(brandIdParamsSchema, 'params'), adminBrandController.getBrand);

router.put(
  '/:id',
  validate(brandIdParamsSchema, 'params'),
  brandUpload.single('logo'),
  uploadBrandLogo,
  mergeLogo,
  validate(updateBrandSchema),
  adminBrandController.updateBrand
);

router.delete('/:id', validate(brandIdParamsSchema, 'params'), adminBrandController.deleteBrand);

module.exports = router;
