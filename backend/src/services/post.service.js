const sanitizeHtml = require('sanitize-html');
const prisma = require('../utils/prisma');
const { AppError, NotFoundError } = require('../errors/AppError');
const { generateSlug, calculateReadTime, generateExcerpt } = require('../utils/postHelpers');
const { mergeTagIdsAndNewNames } = require('./tag.service');
const { assertTransitionAllowed } = require('../utils/postStatusTransitions');

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
  scheduledAt: true,
  viewCount: true,
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

/**
 * @param {import('@prisma/client').Prisma.PostCreateInput['status']} status
 * @param {Date | null} scheduledAt
 */
function assertScheduledConsistency(status, scheduledAt) {
  if (status === 'SCHEDULED' && !scheduledAt) {
    throw new AppError('scheduledAt is required when status is SCHEDULED', 400, 'INVALID_SCHEDULE');
  }
  if (status !== 'SCHEDULED' && scheduledAt) {
    throw new AppError('scheduledAt must be empty unless status is SCHEDULED', 400, 'INVALID_SCHEDULE');
  }
}

// ─── Service functions ────────────────────────────────────────────────────────

/**
 * Admin: create a news post (only admins call this via routes).
 */
const createPost = async ({
  authorId,
  title,
  content,
  excerpt,
  categoryId,
  tagIds,
  newTagNames = [],
  coverImageUrl,
  status = 'DRAFT',
  scheduledAt = null,
}) => {
  if (categoryId != null) {
    const cat = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!cat) throw new NotFoundError('Category');
  }

  assertScheduledConsistency(status, scheduledAt ? new Date(scheduledAt) : null);

  const sanitizedContent = sanitizeHtml(content, sanitizeConfig);
  const slug = generateSlug(title);
  const readTime = calculateReadTime(sanitizedContent);
  const finalExcerpt = excerpt || generateExcerpt(sanitizedContent);

  const mergedTagIds = await mergeTagIdsAndNewNames({
    tagIds: tagIds || [],
    newTagNames: newTagNames || [],
  });

  let publishedAt = null;
  if (status === 'PUBLISHED') {
    publishedAt = new Date();
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
      status,
      publishedAt,
      scheduledAt: status === 'SCHEDULED' && scheduledAt ? new Date(scheduledAt) : null,
      tags: mergedTagIds.length > 0
        ? { create: mergedTagIds.map((tagId) => ({ tagId })) }
        : undefined,
    },
    select: fullSelect,
  });
};

/**
 * Admin: update post — never regenerates slug from title.
 */
const updatePost = async ({
  postId,
  data,
  coverImageUrl,
}) => {
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) throw new NotFoundError('Post');

  const updateData = {};

  if (data.title !== undefined) updateData.title = data.title;
  if (data.content !== undefined) {
    updateData.content = sanitizeHtml(data.content, sanitizeConfig);
    updateData.readTime = calculateReadTime(updateData.content);
    if (data.excerpt === undefined || data.excerpt === '') {
      updateData.excerpt = generateExcerpt(updateData.content);
    }
  }
  if (data.excerpt !== undefined) updateData.excerpt = data.excerpt;
  if (data.categoryId !== undefined) {
    if (data.categoryId != null) {
      const cat = await prisma.category.findUnique({ where: { id: data.categoryId } });
      if (!cat) throw new NotFoundError('Category');
    }
    updateData.categoryId = data.categoryId;
  }
  if (coverImageUrl) updateData.coverImage = coverImageUrl;

  if (data.tagIds !== undefined || data.newTagNames !== undefined) {
    const mergedTagIds = await mergeTagIdsAndNewNames({
      tagIds: data.tagIds ?? [],
      newTagNames: data.newTagNames ?? [],
    });
    updateData.tags = {
      deleteMany: {},
      ...(mergedTagIds.length > 0
        ? { create: mergedTagIds.map((tagId) => ({ tagId })) }
        : {}),
    };
  }

  if (Object.keys(updateData).length === 0 && !coverImageUrl) {
    throw new AppError('At least one field is required for update', 400);
  }

  return prisma.post.update({
    where: { id: postId },
    data: updateData,
    select: fullSelect,
  });
};

/**
 * Admin: soft-delete — transition to ARCHIVED.
 */
const deletePost = async ({ postId }) => {
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) throw new NotFoundError('Post');
  assertTransitionAllowed(post.status, 'ARCHIVED');
  return prisma.post.update({
    where: { id: postId },
    data: { status: 'ARCHIVED', scheduledAt: null },
    select: listSelect,
  });
};

const publishPostNow = async ({ postId }) => {
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) throw new NotFoundError('Post');
  assertTransitionAllowed(post.status, 'PUBLISHED');
  return prisma.post.update({
    where: { id: postId },
    data: {
      status: 'PUBLISHED',
      publishedAt: new Date(),
      scheduledAt: null,
    },
    select: listSelect,
  });
};

const schedulePost = async ({ postId, scheduledAt }) => {
  const at = new Date(scheduledAt);
  if (Number.isNaN(at.getTime()) || at <= new Date()) {
    throw new AppError('scheduledAt must be a future datetime', 400, 'INVALID_SCHEDULE');
  }
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) throw new NotFoundError('Post');

  if (post.status === 'SCHEDULED') {
    return prisma.post.update({
      where: { id: postId },
      data: { scheduledAt: at },
      select: listSelect,
    });
  }

  assertTransitionAllowed(post.status, 'SCHEDULED');
  return prisma.post.update({
    where: { id: postId },
    data: { status: 'SCHEDULED', scheduledAt: at, publishedAt: null },
    select: listSelect,
  });
};

const archivePost = async ({ postId }) => {
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) throw new NotFoundError('Post');
  assertTransitionAllowed(post.status, 'ARCHIVED');
  return prisma.post.update({
    where: { id: postId },
    data: { status: 'ARCHIVED', scheduledAt: null },
    select: listSelect,
  });
};

const incrementViewCount = async (postId) => {
  try {
    await prisma.post.update({
      where: { id: postId },
      data: { viewCount: { increment: 1 } },
    });
  } catch (e) {
    // ignore — post may have been deleted
  }
};

/**
 * Public list: only PUBLISHED.
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
      ? {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { excerpt: { contains: search, mode: 'insensitive' } },
          ],
        }
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
 * Public detail: only PUBLISHED visible to everyone.
 */
const getPostBySlug = async ({ slug }) => {
  const post = await prisma.post.findUnique({
    where: { slug },
    select: fullSelect,
  });

  if (!post) throw new NotFoundError('Post');
  if (post.status !== 'PUBLISHED') {
    throw new NotFoundError('Post');
  }

  return post;
};

const getPostByIdAdmin = async ({ postId }) => {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: fullSelect,
  });
  if (!post) throw new NotFoundError('Post');
  return post;
};

/**
 * Related posts: same category OR overlapping tags; fill with latest PUBLISHED if needed.
 */
const getRelatedPosts = async ({ slug, limit = 4 }) => {
  const current = await prisma.post.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      categoryId: true,
      tags: { select: { tagId: true } },
    },
  });
  if (!current) throw new NotFoundError('Post');

  const tagIds = current.tags.map((t) => t.tagId);

  const orConditions = [];
  if (current.categoryId != null) {
    orConditions.push({ categoryId: current.categoryId });
  }
  if (tagIds.length > 0) {
    orConditions.push({ tags: { some: { tagId: { in: tagIds } } } });
  }

  const baseWhere = {
    status: 'PUBLISHED',
    slug: { not: slug },
  };

  let rows = await prisma.post.findMany({
    where:
      orConditions.length > 0
        ? { ...baseWhere, OR: orConditions }
        : baseWhere,
    orderBy: { publishedAt: 'desc' },
    take: limit,
    select: listSelect,
  });

  if (rows.length < limit && orConditions.length > 0) {
    const seen = new Set(rows.map((p) => p.id));
    const filler = await prisma.post.findMany({
      where: {
        ...baseWhere,
        id: { notIn: [...seen] },
      },
      orderBy: { publishedAt: 'desc' },
      take: limit - rows.length,
      select: listSelect,
    });
    rows = rows.concat(filler);
  }

  return rows.slice(0, limit);
};

/**
 * Admin: get all posts regardless of status.
 */
const getAllPostsAdmin = async ({ status, page = 1, limit = 10, search }) => {
  const skip = (page - 1) * limit;
  const where = {
    ...(status ? { status } : {}),
    ...(search
      ? {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { excerpt: { contains: search, mode: 'insensitive' } },
          ],
        }
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

/**
 * Publish SCHEDULED posts whose scheduledAt has passed (cron job).
 */
const publishDueScheduledPosts = async () => {
  const now = new Date();
  const due = await prisma.post.findMany({
    where: {
      status: 'SCHEDULED',
      scheduledAt: { lte: now },
    },
    select: { id: true, title: true, scheduledAt: true },
  });

  for (const row of due) {
    await prisma.post.update({
      where: { id: row.id },
      data: {
        status: 'PUBLISHED',
        publishedAt: row.scheduledAt || now,
        scheduledAt: null,
      },
    });
    console.log(`[PublishScheduledJob] Published post #${row.id}: "${row.title}"`);
  }

  return due.length;
};

module.exports = {
  createPost,
  updatePost,
  deletePost,
  publishPostNow,
  schedulePost,
  archivePost,
  incrementViewCount,
  getPublishedPosts,
  getPostBySlug,
  getPostByIdAdmin,
  getRelatedPosts,
  getAllPostsAdmin,
  publishDueScheduledPosts,
};
