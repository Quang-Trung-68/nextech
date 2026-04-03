const express = require('express');
const router = express.Router();
const postController = require('../controllers/post.controller');
const { protect, restrictTo } = require('../middleware/auth');
const { validate } = require('../middleware/validateRequest');
const { blogUpload, uploadBlogCover } = require('../middleware/blogUpload');
const {
  createPostSchema,
  updatePostSchema,
  postQuerySchema,
  postParamsSchema,
  schedulePostSchema,
} = require('../validations/post.validation');

router.use(protect, restrictTo('ADMIN'));

router.get(
  '/',
  validate(postQuerySchema, 'query'),
  postController.getAllPostsAdmin
);

router.post(
  '/upload-cover',
  blogUpload.single('coverImage'),
  uploadBlogCover,
  (req, res) => {
    const url = req.cloudinarySingle?.url;
    if (!url) {
      return res.status(400).json({ status: 'error', message: 'No image uploaded' });
    }
    res.status(200).json({ status: 'success', data: { url } });
  }
);

router.post(
  '/',
  blogUpload.single('coverImage'),
  uploadBlogCover,
  validate(createPostSchema),
  postController.createPost
);

router.get(
  '/:id',
  validate(postParamsSchema, 'params'),
  postController.getPostByIdAdmin
);

router.patch(
  '/:id',
  validate(postParamsSchema, 'params'),
  blogUpload.single('coverImage'),
  uploadBlogCover,
  validate(updatePostSchema),
  postController.updatePost
);

router.delete(
  '/:id',
  validate(postParamsSchema, 'params'),
  postController.deletePost
);

router.patch(
  '/:id/publish',
  validate(postParamsSchema, 'params'),
  postController.publishPostNow
);

router.patch(
  '/:id/schedule',
  validate(postParamsSchema, 'params'),
  validate(schedulePostSchema),
  postController.schedulePost
);

router.patch(
  '/:id/archive',
  validate(postParamsSchema, 'params'),
  postController.archivePost
);

module.exports = router;
