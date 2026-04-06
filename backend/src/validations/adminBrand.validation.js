const { z } = require('zod');

const emptyToUndef = (v) => (v === '' || v === undefined ? undefined : v);

const carouselOrderField = z.preprocess((v) => {
  if (v === '' || v === undefined || v === null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}, z.number().int().min(0).max(99999).nullable().optional());

const createBrandSchema = z.object({
  name: z.string().trim().min(1, 'Bắt buộc').max(120),
  slug: z.preprocess(emptyToUndef, z.string().trim().min(1).max(100).optional()),
  description: z.preprocess(emptyToUndef, z.string().trim().max(500).optional()),
  logo: z.preprocess(emptyToUndef, z.string().url('URL logo không hợp lệ').optional()),
  websiteUrl: z.preprocess(emptyToUndef, z.string().url().optional()),
  carouselOrder: carouselOrderField,
  carouselCategorySlug: z.preprocess(
    emptyToUndef,
    z.enum(['phone', 'laptop', 'tablet', 'accessories']).optional()
  ),
});

const updateBrandSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  slug: z.string().trim().min(1).max(100).optional(),
  description: z.preprocess(emptyToUndef, z.string().trim().max(500).optional().nullable()),
  logo: z.preprocess((v) => {
    if (v === '' || v === undefined) return undefined;
    if (v === null || v === 'null') return null;
    return v;
  }, z.union([z.string().url(), z.null()]).optional()),
  websiteUrl: z.preprocess((v) => {
    if (v === undefined) return undefined;
    if (v === '' || v === null || v === 'null') return null;
    return v;
  }, z.union([z.string().url(), z.null()]).optional()),
  carouselOrder: carouselOrderField,
  carouselCategorySlug: z.preprocess((v) => {
    if (v === undefined) return undefined;
    if (v === '' || v === null || v === 'null') return null;
    return v;
  }, z.enum(['phone', 'laptop', 'tablet', 'accessories']).optional().nullable()),
});

const brandIdParamsSchema = z.object({
  id: z.string().cuid('id không hợp lệ'),
});

module.exports = {
  createBrandSchema,
  updateBrandSchema,
  brandIdParamsSchema,
};
