const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/auth');
const { validate } = require('../middleware/validateRequest');
const productVariantController = require('../controllers/productVariant.controller');
const {
  upsertAttributesBodySchema,
  upsertVariantsBodySchema,
  updateVariantBodySchema,
  productIdParamsSchema,
  productVariantParamsSchema,
} = require('../validations/productVariant.validation');

router.use(protect, restrictTo('ADMIN'));

router.get(
  '/:id/attributes',
  validate(productIdParamsSchema, 'params'),
  productVariantController.getAttributes
);

router.put(
  '/:id/attributes',
  validate(productIdParamsSchema, 'params'),
  validate(upsertAttributesBodySchema),
  productVariantController.upsertAttributes
);

router.get(
  '/:id/variants',
  validate(productIdParamsSchema, 'params'),
  productVariantController.getVariants
);

router.put(
  '/:id/variants',
  validate(productIdParamsSchema, 'params'),
  validate(upsertVariantsBodySchema),
  productVariantController.upsertVariants
);

router.patch(
  '/:id/variants/:variantId',
  validate(productVariantParamsSchema, 'params'),
  validate(updateVariantBodySchema),
  productVariantController.updateVariant
);

router.delete(
  '/:id/variants/:variantId',
  validate(productVariantParamsSchema, 'params'),
  productVariantController.deleteVariant
);

module.exports = router;
