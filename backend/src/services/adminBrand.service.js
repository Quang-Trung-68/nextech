const prisma = require('../utils/prisma');
const { NotFoundError, AppError } = require('../errors/AppError');
const { generateBaseSlug } = require('../utils/productSlugify');

const CATEGORY_SLUGS = new Set(['phone', 'laptop', 'tablet', 'accessories']);

async function ensureUniqueSlug(rawSlug, excludeBrandId) {
  let base = String(rawSlug || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-');
  if (!base) base = 'brand';
  let candidate = base;
  let n = 2;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const existing = await prisma.brand.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });
    if (!existing || (excludeBrandId && existing.id === excludeBrandId)) {
      return candidate;
    }
    candidate = `${base}-${n}`;
    n += 1;
  }
}

async function generateSlugFromName(name, excludeBrandId) {
  const base = generateBaseSlug(name);
  return ensureUniqueSlug(base, excludeBrandId);
}

const listAdmin = async () => {
  return prisma.brand.findMany({
    orderBy: [{ carouselOrder: 'asc' }, { name: 'asc' }],
    include: {
      _count: { select: { products: true } },
    },
  });
};

const getById = async (id) => {
  const brand = await prisma.brand.findUnique({
    where: { id },
    include: { _count: { select: { products: true } } },
  });
  if (!brand) throw new NotFoundError('Brand');
  return brand;
};

const createBrand = async (data) => {
  const name = String(data.name).trim();
  if (!name) throw new AppError('Tên thương hiệu không hợp lệ', 400, 'VALIDATION_ERROR');

  const slug =
    data.slug && String(data.slug).trim()
      ? await ensureUniqueSlug(String(data.slug).trim(), null)
      : await generateSlugFromName(name, null);

  const websiteUrl =
    data.websiteUrl != null && String(data.websiteUrl).trim() !== '' ? String(data.websiteUrl).trim() : null;
  const carouselCategorySlug =
    data.carouselCategorySlug != null && String(data.carouselCategorySlug).trim() !== ''
      ? String(data.carouselCategorySlug).trim()
      : null;
  if (carouselCategorySlug && !CATEGORY_SLUGS.has(carouselCategorySlug)) {
    throw new AppError('carouselCategorySlug phải là phone | laptop | tablet | accessories', 400, 'VALIDATION_ERROR');
  }

  let carouselOrder = null;
  if (data.carouselOrder != null && data.carouselOrder !== '') {
    const n = Number(data.carouselOrder);
    carouselOrder = Number.isFinite(n) ? n : null;
  }

  return prisma.brand.create({
    data: {
      name,
      slug,
      logo: data.logo != null && String(data.logo).trim() !== '' ? String(data.logo).trim() : null,
      description:
        data.description != null && String(data.description).trim() !== ''
          ? String(data.description).trim()
          : null,
      websiteUrl,
      carouselOrder,
      carouselCategorySlug: carouselCategorySlug || null,
    },
    include: { _count: { select: { products: true } } },
  });
};

const updateBrand = async (id, data) => {
  const existing = await prisma.brand.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('Brand');

  const payload = {};

  if (data.name !== undefined) {
    const name = String(data.name).trim();
    if (!name) throw new AppError('Tên thương hiệu không hợp lệ', 400, 'VALIDATION_ERROR');
    payload.name = name;
  }

  if (data.slug !== undefined) {
    const s = String(data.slug).trim();
    if (!s) throw new AppError('Slug không hợp lệ', 400, 'VALIDATION_ERROR');
    payload.slug = await ensureUniqueSlug(s, id);
  }

  if (data.logo !== undefined) {
    payload.logo = data.logo != null && String(data.logo).trim() !== '' ? String(data.logo).trim() : null;
  }

  if (data.description !== undefined) {
    payload.description =
      data.description != null && String(data.description).trim() !== ''
        ? String(data.description).trim()
        : null;
  }

  if (data.websiteUrl !== undefined) {
    payload.websiteUrl =
      data.websiteUrl != null && String(data.websiteUrl).trim() !== '' ? String(data.websiteUrl).trim() : null;
  }

  if (data.carouselOrder !== undefined) {
    if (data.carouselOrder === null || data.carouselOrder === '') {
      payload.carouselOrder = null;
    } else {
      const n = Number(data.carouselOrder);
      payload.carouselOrder = Number.isFinite(n) ? n : null;
    }
  }

  if (data.carouselCategorySlug !== undefined) {
    const c = data.carouselCategorySlug != null && String(data.carouselCategorySlug).trim() !== ''
      ? String(data.carouselCategorySlug).trim()
      : null;
    if (c && !CATEGORY_SLUGS.has(c)) {
      throw new AppError('carouselCategorySlug phải là phone | laptop | tablet | accessories', 400, 'VALIDATION_ERROR');
    }
    payload.carouselCategorySlug = c;
  }

  if (Object.keys(payload).length === 0) {
    throw new AppError('Cần ít nhất một trường để cập nhật', 400, 'VALIDATION_ERROR');
  }

  return prisma.brand.update({
    where: { id },
    data: payload,
    include: { _count: { select: { products: true } } },
  });
};

const deleteBrand = async (id) => {
  const existing = await prisma.brand.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('Brand');
  await prisma.brand.delete({ where: { id } });
  return existing;
};

module.exports = {
  listAdmin,
  getById,
  createBrand,
  updateBrand,
  deleteBrand,
};
