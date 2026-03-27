const { z } = require('zod');

// ─── Post schemas ─────────────────────────────────────────────────────────────

const createPostSchema = z.object({
  title: z.string().trim().min(10, 'Title must be at least 10 characters').max(200),
  content: z.string().min(50, 'Content must be at least 50 characters'), // HTML string
  excerpt: z.string().max(300).optional(),
  categoryId: z.coerce.number().int().positive().optional(),
  tagIds: z.array(z.coerce.number().int().positive()).max(10).optional(),
});

const updatePostSchema = createPostSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field is required for update' }
);

const postQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  category: z.string().trim().optional(),
  tag: z.string().trim().optional(),
  search: z.string().trim().optional(),
  status: z.enum(['DRAFT', 'PENDING', 'PUBLISHED', 'REJECTED']).optional(),
});

const postParamsSchema = z.object({
  id: z.coerce.number().int().positive('Post ID must be a positive integer'),
});

const postSlugParamsSchema = z.object({
  slug: z.string().trim().min(1),
});

// ─── Category schemas ─────────────────────────────────────────────────────────

const createCategorySchema = z.object({
  name: z.string().trim().min(2, 'Category name must be at least 2 characters').max(100),
});

const categoryParamsSchema = z.object({
  id: z.coerce.number().int().positive('Category ID must be a positive integer'),
});

// ─── Tag schemas ──────────────────────────────────────────────────────────────

const createTagSchema = z.object({
  name: z.string().trim().min(2, 'Tag name must be at least 2 characters').max(100),
});

module.exports = {
  createPostSchema,
  updatePostSchema,
  postQuerySchema,
  postParamsSchema,
  postSlugParamsSchema,
  createCategorySchema,
  categoryParamsSchema,
  createTagSchema,
};
