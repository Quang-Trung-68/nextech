const prisma = require('../utils/prisma');
const { AppError, ConflictError, NotFoundError } = require('../errors/AppError');
const { generateSlug } = require('../utils/postHelpers');

/**
 * Create a new blog category.
 * @param {{ name: string }} param0
 */
const createCategory = async ({ name }) => {
  const existing = await prisma.category.findUnique({ where: { name } });
  if (existing) throw new ConflictError(`Category "${name}" already exists`, 'CATEGORY_EXISTS');

  const slug = generateSlug(name);
  return prisma.category.create({ data: { name, slug } });
};

/**
 * Return all categories with their post count.
 */
const getAllCategories = async () => {
  return prisma.category.findMany({
    include: { _count: { select: { posts: true } } },
    orderBy: { name: 'asc' },
  });
};

/**
 * Delete a category by ID.
 * Throws 400 if the category has associated posts.
 * @param {number} id
 */
const deleteCategory = async (id) => {
  const category = await prisma.category.findUnique({
    where: { id },
    include: { _count: { select: { posts: true } } },
  });

  if (!category) throw new NotFoundError('Category');
  if (category._count.posts > 0) {
    throw new AppError('Category has existing posts', 400, 'CATEGORY_HAS_POSTS');
  }

  return prisma.category.delete({ where: { id } });
};

/**
 * @param {number} id
 * @param {{ name: string }} param1
 */
const updateCategory = async (id, { name }) => {
  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) throw new NotFoundError('Category');

  const duplicate = await prisma.category.findFirst({
    where: { name, NOT: { id } },
  });
  if (duplicate) throw new ConflictError(`Category "${name}" already exists`, 'CATEGORY_EXISTS');

  const slug = generateSlug(name);
  return prisma.category.update({
    where: { id },
    data: { name, slug },
  });
};

module.exports = { createCategory, getAllCategories, deleteCategory, updateCategory };
