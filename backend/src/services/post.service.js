const sanitizeHtml = require('sanitize-html');
const prisma = require('../utils/prisma');
const { AppError, NotFoundError, ForbiddenError } = require('../errors/AppError');
const { generateSlug, calculateReadTime, generateExcerpt } = require('../utils/postHelpers');
const { findOrCreateTags } = require('./tag.service');

// ─── Sanitization config ─────────────────────────────────────────────────────

const sanitizeConfig = {
  allowedTags: sanitizeHtml.defaults.allowedTags.concat([
    'img', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'figure', 'figcaption', 'video',
  ]),
  allowedAttributes: {
    ...sanitizeHtml.defaults.allowedAttributes,
    img: ['src', 'alt', 'title', 'width', 'height'],
    a: ['href', 'name', 'target', 'rel'],
    '*': ['class', 'id', 'style'],
  },
};

// ─── Select presets ───────────────────────────────────────────────────────────

const listSelect = {
  id: true,
  title: true,
  slug: true,
  excerpt: true,
  coverImage: true,
  readTime: true,
  publishedAt: true,
  status: true,
  createdAt: true,
  author: { select: { id: true, name: true } },
  category: { select: { id: true, name: true, slug: true } },
  tags: { select: { tag: { select: { id: true, name: true, slug: true } } } },
};

const fullSelect = {
  ...listSelect,
  content: true,
  updatedAt: true,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const buildTagConnect = (tagIds) =>
  tagIds.map((tagId) => ({ postId_tagId: { postId: undefined, tagId } }));

// ─── Service functions ────────────────────────────────────────────────────────

/**
 * Create a new blog post.
 */
const createPost = async ({
  authorId,
  title,
  content,
  excerpt,
  categoryId,
  tagIds,
  coverImageUrl,
}) => {
  const sanitizedContent = sanitizeHtml(content, sanitizeConfig);
  const slug = generateSlug(title);
  const readTime = calculateReadTime(sanitizedContent);
  const finalExcerpt = excerpt || generateExcerpt(sanitizedContent);

  if (tagIds && tagIds.length > 0) {
    await findOrCreateTags(tagIds);
  }

  return prisma.post.create({
    data: {
      title,
      slug,
      content: sanitizedContent,
      excerpt: finalExcerpt,
      readTime,
      coverImage: coverImageUrl || null,
      authorId,
      categoryId: categoryId || null,
      tags: tagIds && tagIds.length > 0
        ? { create: tagIds.map((tagId) => ({ tagId })) }
        : undefined,
    },
    select: fullSelect,
  });
};

/**
 * Update an existing post. Authorization is checked here.
 */
const updatePost = async ({
  postId,
  requesterId,
  requesterRole,
  data,
  coverImageUrl,
}) => {
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) throw new NotFoundError('Post');

  const isAdmin = requesterRole === 'ADMIN';
  const isOwner = post.authorId === requesterId;

  if (!isOwner && !isAdmin) throw new ForbiddenError('You are not allowed to edit this post');

  if (!isAdmin && (post.status === 'PENDING' || post.status === 'PUBLISHED')) {
    throw new ForbiddenError('You cannot edit a post with status PENDING or PUBLISHED');
  }

  const updateData = {};

  if (data.title !== undefined) {
    updateData.title = data.title;
    updateData.slug = generateSlug(data.title);
  }
  if (data.content !== undefined) {
    updateData.content = sanitizeHtml(data.content, sanitizeConfig);
    updateData.readTime = calculateReadTime(updateData.content);
    if (!data.excerpt) {
      updateData.excerpt = generateExcerpt(updateData.content);
    }
  }
  if (data.excerpt !== undefined) updateData.excerpt = data.excerpt;
  if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;
  if (coverImageUrl) updateData.coverImage = coverImageUrl;

  // Handle tag reconnect
  if (data.tagIds !== undefined) {
    if (data.tagIds.length > 0) {
      await findOrCreateTags(data.tagIds);
    }
    updateData.tags = {
      deleteMany: {},
      ...(data.tagIds.length > 0
        ? { create: data.tagIds.map((tagId) => ({ tagId })) }
        : {}),
    };
  }

  return prisma.post.update({
    where: { id: postId },
    data: updateData,
    select: fullSelect,
  });
};

/**
 * Delete a post. Authorization is checked here.
 */
const deletePost = async ({ postId, requesterId, requesterRole }) => {
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) throw new NotFoundError('Post');

  const isAdmin = requesterRole === 'ADMIN';
  const isOwner = post.authorId === requesterId;

  if (!isOwner && !isAdmin) throw new ForbiddenError('You are not allowed to delete this post');
  if (post.status === 'PUBLISHED' && !isAdmin) {
    throw new ForbiddenError('Only admins can delete published posts');
  }

  return prisma.post.delete({ where: { id: postId } });
};

/**
 * Author submits their draft/rejected post for admin review.
 */
const submitForReview = async ({ postId, requesterId }) => {
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) throw new NotFoundError('Post');

  if (post.authorId !== requesterId) {
    throw new ForbiddenError('You are not the owner of this post');
  }
  if (post.status !== 'DRAFT' && post.status !== 'REJECTED') {
    throw new AppError(
      'Only DRAFT or REJECTED posts can be submitted for review',
      400,
      'INVALID_STATUS_TRANSITION'
    );
  }

  return prisma.post.update({
    where: { id: postId },
    data: { status: 'PENDING' },
    select: listSelect,
  });
};

/**
 * Admin approves a pending post — sets status to PUBLISHED.
 */
const approvePost = async ({ postId }) => {
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) throw new NotFoundError('Post');

  if (post.status !== 'PENDING') {
    throw new AppError('Only PENDING posts can be approved', 400, 'INVALID_STATUS_TRANSITION');
  }

  return prisma.post.update({
    where: { id: postId },
    data: { status: 'PUBLISHED', publishedAt: new Date() },
    select: listSelect,
  });
};

/**
 * Admin rejects a pending post.
 */
const rejectPost = async ({ postId, reason }) => {
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) throw new NotFoundError('Post');

  if (post.status !== 'PENDING') {
    throw new AppError('Only PENDING posts can be rejected', 400, 'INVALID_STATUS_TRANSITION');
  }

  return prisma.post.update({
    where: { id: postId },
    data: { status: 'REJECTED' },
    select: listSelect,
  });
};

/**
 * Get list of published posts with optional filters.
 */
const getPublishedPosts = async ({
  page = 1,
  limit = 10,
  categorySlug,
  tagSlug,
  search,
}) => {
  const skip = (page - 1) * limit;

  const where = {
    status: 'PUBLISHED',
    ...(categorySlug ? { category: { slug: categorySlug } } : {}),
    ...(tagSlug ? { tags: { some: { tag: { slug: tagSlug } } } } : {}),
    ...(search
      ? { title: { contains: search, mode: 'insensitive' } }
      : {}),
  };

  const [data, total] = await prisma.$transaction([
    prisma.post.findMany({
      where,
      skip,
      take: limit,
      orderBy: { publishedAt: 'desc' },
      select: listSelect,
    }),
    prisma.post.count({ where }),
  ]);

  return { data, total, page, limit };
};

/**
 * Get a single post by slug.
 * Access rules: PUBLISHED → public; own DRAFT/PENDING/REJECTED → owner; any → admin.
 */
const getPostBySlug = async ({ slug, requesterId, requesterRole }) => {
  const post = await prisma.post.findUnique({
    where: { slug },
    select: fullSelect,
  });

  if (!post) throw new NotFoundError('Post');

  const isAdmin = requesterRole === 'ADMIN';
  const isOwner = requesterId && post.author.id === requesterId;

  if (post.status !== 'PUBLISHED' && !isAdmin && !isOwner) {
    throw new NotFoundError('Post');
  }

  return post;
};

/**
 * Get the author's own posts (all statuses).
 */
const getMyPosts = async ({ authorId, status, page = 1, limit = 10 }) => {
  const skip = (page - 1) * limit;
  const where = {
    authorId,
    ...(status ? { status } : {}),
  };

  const [data, total] = await prisma.$transaction([
    prisma.post.findMany({
      where,
      skip,
      take: limit,
      orderBy: { updatedAt: 'desc' },
      select: listSelect,
    }),
    prisma.post.count({ where }),
  ]);

  return { data, total, page, limit };
};

/**
 * Admin: get all posts regardless of status.
 */
const getAllPostsAdmin = async ({ status, page = 1, limit = 10, search }) => {
  const skip = (page - 1) * limit;
  const where = {
    ...(status ? { status } : {}),
    ...(search
      ? { title: { contains: search, mode: 'insensitive' } }
      : {}),
  };

  const [data, total] = await prisma.$transaction([
    prisma.post.findMany({
      where,
      skip,
      take: limit,
      orderBy: { updatedAt: 'desc' },
      select: listSelect,
    }),
    prisma.post.count({ where }),
  ]);

  return { data, total, page, limit };
};

module.exports = {
  createPost,
  updatePost,
  deletePost,
  submitForReview,
  approvePost,
  rejectPost,
  getPublishedPosts,
  getPostBySlug,
  getMyPosts,
  getAllPostsAdmin,
};
