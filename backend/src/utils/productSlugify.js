const slugify = require('slugify');

/**
 * @param {string} name
 * @returns {string}
 */
function generateBaseSlug(name) {
  const s = slugify(String(name || ''), { lower: true, locale: 'vi', strict: true });
  return s || 'san-pham';
}

/**
 * @param {import('@prisma/client').PrismaClient} prisma
 * @param {string} name
 * @param {string} [excludeProductId]
 * @returns {Promise<string>}
 */
async function generateUniqueProductSlug(prisma, name, excludeProductId) {
  let base = generateBaseSlug(name);
  let candidate = base;
  let n = 2;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const existing = await prisma.product.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });
    if (!existing || (excludeProductId && existing.id === excludeProductId)) {
      return candidate;
    }
    candidate = `${base}-${n}`;
    n += 1;
  }
}

/**
 * @param {import('@prisma/client').PrismaClient} prisma
 * @param {string} name
 * @param {string} [excludeProductId]
 * @returns {Promise<string>}
 */
async function generateUniqueProductSlugWithRetry(prisma, name, excludeProductId) {
  try {
    return await generateUniqueProductSlug(prisma, name, excludeProductId);
  } catch (e) {
    throw e;
  }
}

module.exports = {
  generateBaseSlug,
  generateUniqueProductSlug,
  generateUniqueProductSlugWithRetry,
};
