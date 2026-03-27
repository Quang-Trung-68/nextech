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
    requesterId: req.user?.id,
    requesterRole: req.user?.role,
  });
  res.status(200).json({ status: 'success', data: { post } });
});

// ─── Authenticated user ───────────────────────────────────────────────────────

const createPost = catchAsync(async (req, res) => {
  const { title, content, excerpt, categoryId, tagIds } = req.body;
  const coverImageUrl = req.file ? req.cloudinarySingle?.url : undefined;

  const post = await postService.createPost({
    authorId: req.user.id,
    title,
    content,
    excerpt,
    categoryId: categoryId ? Number(categoryId) : undefined,
    tagIds: tagIds ? tagIds.map(Number) : [],
    coverImageUrl,
  });
  res.status(201).json({ status: 'success', data: { post } });
});

const updatePost = catchAsync(async (req, res) => {
  const coverImageUrl = req.file ? req.cloudinarySingle?.url : undefined;
  const { tagIds, categoryId, ...rest } = req.body;

  const post = await postService.updatePost({
    postId: Number(req.params.id),
    requesterId: req.user.id,
    requesterRole: req.user.role,
    data: {
      ...rest,
      categoryId: categoryId !== undefined ? Number(categoryId) : undefined,
      tagIds: tagIds !== undefined ? tagIds.map(Number) : undefined,
    },
    coverImageUrl,
  });
  res.status(200).json({ status: 'success', data: { post } });
});

const deletePost = catchAsync(async (req, res) => {
  await postService.deletePost({
    postId: Number(req.params.id),
    requesterId: req.user.id,
    requesterRole: req.user.role,
  });
  res.status(200).json({ status: 'success', data: null });
});

const submitForReview = catchAsync(async (req, res) => {
  const post = await postService.submitForReview({
    postId: Number(req.params.id),
    requesterId: req.user.id,
  });
  res.status(200).json({ status: 'success', data: { post } });
});

const getMyPosts = catchAsync(async (req, res) => {
  const { status, page, limit } = req.query;
  const result = await postService.getMyPosts({
    authorId: req.user.id,
    status,
    page: Number(page) || 1,
    limit: Number(limit) || 10,
  });
  res.status(200).json({ status: 'success', data: result });
});

// ─── Admin ────────────────────────────────────────────────────────────────────

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

const approvePost = catchAsync(async (req, res) => {
  const post = await postService.approvePost({ postId: Number(req.params.id) });
  res.status(200).json({ status: 'success', data: { post } });
});

const rejectPost = catchAsync(async (req, res) => {
  const post = await postService.rejectPost({
    postId: Number(req.params.id),
    reason: req.body?.reason,
  });
  res.status(200).json({ status: 'success', data: { post } });
});

module.exports = {
  getPublishedPosts,
  getPostBySlug,
  createPost,
  updatePost,
  deletePost,
  submitForReview,
  getMyPosts,
  getAllPostsAdmin,
  approvePost,
  rejectPost,
};
