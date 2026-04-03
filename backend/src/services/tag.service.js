const slugify = require('slugify');
const prisma = require('../utils/prisma');
const { ConflictError, NotFoundError, AppError } = require('../errors/AppError');
const { generateSlug, generateDeterministicTagSlug } = require('../utils/postHelpers');

/**
 * Create a new tag (admin only).
 * @param {{ name: string }} param0
 */
const normalizeTagName = (name) => String(name || '').trim().toLowerCase();

const createTag = async ({ name }) => {
  const normalized = normalizeTagName(name);
  if (!normalized) {
    throw new AppError('Tag name is required', 400, 'INVALID_TAG');
  }

  const existing = await prisma.tag.findFirst({
    where: { name: { equals: normalized, mode: 'insensitive' } },
  });
  if (existing) throw new ConflictError(`Tag "${normalized}" already exists`, 'TAG_EXISTS');

  const slug = generateSlug(normalized);
  return prisma.tag.create({ data: { name: normalized, slug } });
};

/**
 * List all tags with their post count.
 */
const getAllTags = async () => {
  return prisma.tag.findMany({
    include: { _count: { select: { posts: true } } },
    orderBy: { name: 'asc' },
  });
};

/**
 * Admin search tags by name or slug fragment.
 * @param {{ q: string, limit?: number }} param0
 */
const searchTags = async ({ q, limit = 10 }) => {
  const qTrim = String(q || '').trim();
  if (!qTrim) return [];
  const slugPart = slugify(qTrim, { lower: true, locale: 'vi', strict: true });
  return prisma.tag.findMany({
    where: {
      OR: [
        { name: { contains: qTrim, mode: 'insensitive' } },
        ...(slugPart ? [{ slug: { contains: slugPart } }] : []),
      ],
    },
    take: limit,
    orderBy: { name: 'asc' },
  });
};

/**
 * Validate that all tagIds exist in the database and return the tag records.
 * Throws 400 if any tagId is not found.
 *
 * @param {number[]} tagIds
 * @returns {Promise<import('@prisma/client').Tag[]>}
 */
const findOrCreateTags = async (tagIds) => {
  if (!tagIds || tagIds.length === 0) return [];

  const tags = await prisma.tag.findMany({ where: { id: { in: tagIds } } });
  if (tags.length !== tagIds.length) {
    throw new AppError('One or more tag IDs not found', 400, 'TAG_NOT_FOUND');
  }
  return tags;
};

/**
 * Merge existing tag IDs with new tag names (upsert by deterministic slug; match existing by name).
 * Validates all provided tagIds exist.
 *
 * @param {{ tagIds?: number[], newTagNames?: string[] }} param0
 * @param {import('@prisma/client').Prisma.TransactionClient} [tx]
 * @returns {Promise<number[]>}
 */
const mergeTagIdsAndNewNames = async ({ tagIds = [], newTagNames = [] }, tx = prisma) => {
  const rawIds = (tagIds || [])
    .map(Number)
    .filter((n) => Number.isInteger(n) && n > 0);
  if (rawIds.length) {
    const found = await tx.tag.findMany({ where: { id: { in: rawIds } } });
    if (found.length !== rawIds.length) {
      throw new AppError('One or more tag IDs not found', 400, 'TAG_NOT_FOUND');
    }
  }
  const ids = new Set(rawIds);
  for (const raw of newTagNames || []) {
    const name = normalizeTagName(raw);
    if (!name) continue;
    const existing = await tx.tag.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } },
    });
    if (existing) {
      ids.add(existing.id);
      continue;
    }
    const slug = generateDeterministicTagSlug(name);
    const tag = await tx.tag.upsert({
      where: { slug },
      create: { name, slug },
      update: {},
    });
    ids.add(tag.id);
  }
  return [...ids];
};

/**
 * @param {number} id
 */
const deleteTag = async (id) => {
  const tag = await prisma.tag.findUnique({ where: { id } });
  if (!tag) throw new NotFoundError('Tag');
  return prisma.tag.delete({ where: { id } });
};

module.exports = {
  createTag,
  getAllTags,
  searchTags,
  findOrCreateTags,
  mergeTagIdsAndNewNames,
  deleteTag,
  normalizeTagName,
};
