const express = require('express');
const router = express.Router();
const postController = require('../controllers/post.controller');
const { protect, restrictTo, requireEmailVerified } = require('../middleware/auth');
const { validate } = require('../middleware/validateRequest');
const { blogUpload, uploadBlogCover } = require('../middleware/blogUpload');
const {
  createPostSchema,
  updatePostSchema,
  postQuerySchema,
  postParamsSchema,
} = require('../validations/post.validation');

// ─── USER routes (protect + requireEmailVerified) ─────────────────────────────

// ⚠️ Register /me BEFORE /:slug to prevent Express matching "me" as a slug param
router.get(
  '/me',
  protect,
  requireEmailVerified,
  postController.getMyPosts
);

// ─── PUBLIC routes ────────────────────────────────────────────────────────────

router.get(
  '/',
  validate(postQuerySchema, 'query'),
  postController.getPublishedPosts
);

// getPostBySlug is also used by non-authed users for published posts,
// but owners/admins can view own posts — pass auth info optionally
router.get(
  '/:slug',
  (req, res, next) => {
    // Attach user if token present, but don't require it
    protect(req, res, (err) => {
      if (err) {
        req.user = null;
      }
      next();
    });
  },
  postController.getPostBySlug
);

// ─── Authenticated user routes ────────────────────────────────────────────────

router.post(
  '/',
  protect,
  requireEmailVerified,
  blogUpload.single('coverImage'),
  uploadBlogCover,
  validate(createPostSchema),
  postController.createPost
);

router.patch(
  '/:id',
  protect,
  requireEmailVerified,
  validate(postParamsSchema, 'params'),
  blogUpload.single('coverImage'),
  uploadBlogCover,
  validate(updatePostSchema),
  postController.updatePost
);

router.delete(
  '/:id',
  protect,
  requireEmailVerified,
  validate(postParamsSchema, 'params'),
  postController.deletePost
);

router.patch(
  '/:id/submit',
  protect,
  requireEmailVerified,
  validate(postParamsSchema, 'params'),
  postController.submitForReview
);

// ─── ADMIN routes ─────────────────────────────────────────────────────────────

router.get(
  '/admin/all',
  protect,
  restrictTo('ADMIN'),
  validate(postQuerySchema, 'query'),
  postController.getAllPostsAdmin
);

router.patch(
  '/admin/:id/approve',
  protect,
  restrictTo('ADMIN'),
  validate(postParamsSchema, 'params'),
  postController.approvePost
);

router.patch(
  '/admin/:id/reject',
  protect,
  restrictTo('ADMIN'),
  validate(postParamsSchema, 'params'),
  postController.rejectPost
);

module.exports = router;
