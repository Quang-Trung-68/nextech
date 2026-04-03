const express = require('express');
const router = express.Router();
const postController = require('../controllers/post.controller');
const { validate } = require('../middleware/validateRequest');
const { postQuerySchema, postSlugParamsSchema } = require('../validations/post.validation');

// ─── PUBLIC routes only (read) ────────────────────────────────────────────────

router.get(
  '/',
  validate(postQuerySchema, 'query'),
  postController.getPublishedPosts
);

router.get(
  '/related/:slug',
  validate(postSlugParamsSchema, 'params'),
  postController.getRelatedPosts
);

router.get(
  '/:slug',
  validate(postSlugParamsSchema, 'params'),
  postController.getPostBySlug
);

module.exports = router;
