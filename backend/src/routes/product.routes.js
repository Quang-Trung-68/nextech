const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');
const reviewController = require('../controllers/review.controller');
const { protect, restrictTo } = require('../middleware/auth');
const { validate } = require('../middleware/validateRequest');
const {
  createProductSchema,
  updateProductSchema,
  productQuerySchema,
  productParamsSchema,
  productSlugParamsSchema,
  productBrandsQuerySchema,
} = require('../validations/product.validation');
const {
  getProductReviewsQuerySchema,
  productReviewsParamsSchema,
} = require('../validations/review.validation');

router.get('/', validate(productQuerySchema, 'query'), productController.getProducts);
router.get('/brands', validate(productBrandsQuerySchema, 'query'), productController.getBrandsByType);
router.get('/by-slug/:slug', validate(productSlugParamsSchema, 'params'), productController.getProductBySlug);

// Public: danh sách reviews của 1 sản phẩm (productId = cuid)
router.get(
  '/:productId/reviews',
  validate(productReviewsParamsSchema, 'params'),
  validate(getProductReviewsQuerySchema, 'query'),
  reviewController.getProductReviews
);

router.get(
  '/:id/related',
  validate(productParamsSchema, 'params'),
  productController.getRelatedProducts,
);

router.get('/:id', validate(productParamsSchema, 'params'), productController.getProductById);

router.post('/', protect, restrictTo('ADMIN'), validate(createProductSchema), productController.createProduct);
router.put('/:id', protect, restrictTo('ADMIN'), validate(productParamsSchema, 'params'), validate(updateProductSchema), productController.updateProduct);
router.delete('/:id', protect, restrictTo('ADMIN'), validate(productParamsSchema, 'params'), productController.deleteProduct);

module.exports = router;
