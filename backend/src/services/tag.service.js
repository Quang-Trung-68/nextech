const prisma = require('../utils/prisma');
const { ConflictError, NotFoundError, AppError } = require('../errors/AppError');
const { generateSlug } = require('../utils/postHelpers');

/**
 * Create a new tag (admin only).
 * @param {{ name: string }} param0
 */
const createTag = async ({ name }) => {
  const existing = await prisma.tag.findUnique({ where: { name } });
  if (existing) throw new ConflictError(`Tag "${name}" already exists`, 'TAG_EXISTS');

  const slug = generateSlug(name);
  return prisma.tag.create({ data: { name, slug } });
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

module.exports = { createTag, getAllTags, findOrCreateTags };
