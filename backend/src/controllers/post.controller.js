const postService = require('../services/post.service');
const catchAsync = require('../utils/catchAsync');

// ─── Public ───────────────────────────────────────────────────────────────────

const getPublishedPosts = catchAsync(async (req, res) => {
  const { page, limit, category, tag, search } = req.query;
  const result = await postService.getPublishedPosts({
    page: Number(page) || 1,
    limit: Number(limit) || 10,
    categorySlug: category,
    tagSlug: tag,
    search,
  });
  res.status(200).json({ status: 'success', data: result });
});

const getPostBySlug = catchAsync(async (req, res) => {
  const post = await postService.getPostBySlug({
    slug: req.params.slug,
  });
  setImmediate(() => {
    postService.incrementViewCount(post.id);
  });
  res.status(200).json({ status: 'success', data: { post } });
});

const getRelatedPosts = catchAsync(async (req, res) => {
  const posts = await postService.getRelatedPosts({
    slug: req.params.slug,
    limit: 4,
  });
  res.status(200).json({ status: 'success', data: { posts } });
});

// ─── Admin ────────────────────────────────────────────────────────────────────

const createPost = catchAsync(async (req, res) => {
  const {
    title,
    content,
    excerpt,
    categoryId,
    tagIds,
    newTagNames,
    status,
    scheduledAt,
    coverImageUrl: bodyCoverUrl,
  } = req.body;
  const coverImageUrl = req.file ? req.cloudinarySingle?.url : bodyCoverUrl;

  const post = await postService.createPost({
    authorId: req.user.id,
    title,
    content,
    excerpt,
    categoryId: categoryId != null ? Number(categoryId) : undefined,
    tagIds: Array.isArray(tagIds) ? tagIds.map(Number) : [],
    newTagNames: Array.isArray(newTagNames) ? newTagNames : [],
    coverImageUrl,
    status: status || 'DRAFT',
    scheduledAt: scheduledAt || null,
  });
  res.status(201).json({ status: 'success', data: { post } });
});

const updatePost = catchAsync(async (req, res) => {
  const coverImageUrl = req.file ? req.cloudinarySingle?.url : req.body.coverImageUrl;
  const { tagIds, newTagNames, categoryId, coverImageUrl: _omitCover, ...rest } = req.body;

  const post = await postService.updatePost({
    postId: Number(req.params.id),
    data: {
      ...rest,
      categoryId: categoryId !== undefined ? (categoryId != null ? Number(categoryId) : null) : undefined,
      tagIds: tagIds !== undefined ? tagIds.map(Number) : undefined,
      newTagNames:
        newTagNames !== undefined ? (Array.isArray(newTagNames) ? newTagNames : []) : undefined,
    },
    coverImageUrl,
  });
  res.status(200).json({ status: 'success', data: { post } });
});

const deletePost = catchAsync(async (req, res) => {
  const post = await postService.deletePost({
    postId: Number(req.params.id),
  });
  res.status(200).json({ status: 'success', data: { post } });
});

const getAllPostsAdmin = catchAsync(async (req, res) => {
  const { status, page, limit, search } = req.query;
  const result = await postService.getAllPostsAdmin({
    status,
    page: Number(page) || 1,
    limit: Number(limit) || 10,
    search,
  });
  res.status(200).json({ status: 'success', data: result });
});

const getPostByIdAdmin = catchAsync(async (req, res) => {
  const post = await postService.getPostByIdAdmin({
    postId: Number(req.params.id),
  });
  res.status(200).json({ status: 'success', data: { post } });
});

const publishPostNow = catchAsync(async (req, res) => {
  const post = await postService.publishPostNow({ postId: Number(req.params.id) });
  res.status(200).json({ status: 'success', data: { post } });
});

const schedulePost = catchAsync(async (req, res) => {
  const post = await postService.schedulePost({
    postId: Number(req.params.id),
    scheduledAt: req.body.scheduledAt,
  });
  res.status(200).json({ status: 'success', data: { post } });
});

const archivePost = catchAsync(async (req, res) => {
  const post = await postService.archivePost({ postId: Number(req.params.id) });
  res.status(200).json({ status: 'success', data: { post } });
});

module.exports = {
  getPublishedPosts,
  getPostBySlug,
  getRelatedPosts,
  createPost,
  updatePost,
  deletePost,
  getAllPostsAdmin,
  getPostByIdAdmin,
  publishPostNow,
  schedulePost,
  archivePost,
};
