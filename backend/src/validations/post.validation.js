const { z } = require('zod');

const postStatusEnum = z.enum(['DRAFT', 'PUBLISHED', 'SCHEDULED', 'ARCHIVED']);

const preprocessTagIds = z.preprocess((val) => {
  if (val == null || val === '') return [];
  if (Array.isArray(val)) return val.map((x) => Number(x));
  if (typeof val === 'string') {
    try {
      const p = JSON.parse(val);
      return Array.isArray(p) ? p.map((x) => Number(x)) : [];
    } catch {
      return [];
    }
  }
  return [];
}, z.array(z.number().int().positive()).max(10));

const preprocessNewTagNames = z.preprocess((val) => {
  if (val == null || val === '') return [];
  if (Array.isArray(val)) return val.map((x) => String(x).trim()).filter(Boolean);
  return [];
}, z.array(z.string().trim().min(1).max(50)).max(10));

const preprocessOptionalNewTagNames = z.preprocess((val) => {
  if (val === undefined) return undefined;
  if (val == null || val === '') return [];
  if (Array.isArray(val)) return val.map((x) => String(x).trim()).filter(Boolean);
  return [];
}, z.array(z.string().trim().min(1).max(50)).max(10).optional());

const preprocessOptionalCategoryId = z.preprocess((v) => {
  if (v === '' || v == null || v === undefined) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}, z.number().int().positive().optional());

// ─── Post schemas ─────────────────────────────────────────────────────────────

const createPostSchema = z
  .object({
    title: z.string().trim().min(5, 'Tiêu đề tối thiểu 5 ký tự').max(200, 'Tiêu đề tối đa 200 ký tự'),
    content: z.string().min(1, 'Nội dung không được để trống'),
    excerpt: z
      .preprocess((v) => (v === '' || v == null ? undefined : v), z.string().max(300).optional())
      .optional(),
    categoryId: preprocessOptionalCategoryId.optional(),
    tagIds: preprocessTagIds,
    newTagNames: preprocessNewTagNames,
    status: z.preprocess((v) => (v == null || v === '' ? 'DRAFT' : v), postStatusEnum).optional().default('DRAFT'),
    scheduledAt: z.preprocess(
      (v) => (v === '' || v == null ? null : v),
      z.string().datetime().optional().nullable()
    ),
    coverImageUrl: z
      .preprocess((v) => (v === '' || v == null ? undefined : v), z.string().url('URL ảnh bìa không hợp lệ').optional()),
  })
  .superRefine((data, ctx) => {
    if (data.status === 'SCHEDULED' && !data.scheduledAt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Khi trạng thái là Lên lịch, cần có thời điểm đăng lịch',
        path: ['scheduledAt'],
      });
    }
    if (data.tagIds.length + data.newTagNames.length > 10) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Tối đa 10 tag cho mỗi bài',
        path: ['newTagNames'],
      });
    }
  });

const updatePostSchema = z
  .object({
    title: z.string().trim().min(5, 'Tiêu đề tối thiểu 5 ký tự').max(200, 'Tiêu đề tối đa 200 ký tự').optional(),
    content: z.string().min(1, 'Nội dung không được để trống').optional(),
    excerpt: z
      .preprocess((v) => (v === '' || v == null ? undefined : v), z.string().max(300).optional())
      .optional(),
    categoryId: z
      .preprocess((v) => {
        if (v === '' || v == null) return null;
        const n = Number(v);
        return Number.isFinite(n) ? n : undefined;
      }, z.number().int().positive().nullable().optional()),
    tagIds: preprocessTagIds.optional(),
    newTagNames: preprocessOptionalNewTagNames,
    coverImageUrl: z
      .preprocess((v) => (v === '' || v == null ? undefined : v), z.string().url('URL ảnh bìa không hợp lệ').optional()),
  })
  .superRefine((data, ctx) => {
    if (data.tagIds !== undefined || data.newTagNames !== undefined) {
      const t = data.tagIds ?? [];
      const n = data.newTagNames ?? [];
      if (t.length + n.length > 10) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Tối đa 10 tag cho mỗi bài',
          path: ['newTagNames'],
        });
      }
    }
  });

const postQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  category: z.string().trim().optional(),
  tag: z.string().trim().optional(),
  search: z.string().trim().optional(),
  status: postStatusEnum.optional(),
});

const postParamsSchema = z.object({
  id: z.coerce.number().int().positive('ID bài viết phải là số nguyên dương'),
});

const postSlugParamsSchema = z.object({
  slug: z.string().trim().min(1),
});

const schedulePostSchema = z.object({
  scheduledAt: z.string().datetime('Thời điểm lên lịch không hợp lệ'),
}).refine(
  (data) => new Date(data.scheduledAt) > new Date(),
  { message: 'Thời điểm lên lịch phải sau thời điểm hiện tại', path: ['scheduledAt'] }
);

// ─── Category schemas ─────────────────────────────────────────────────────────

const createCategorySchema = z.object({
  name: z.string().trim().min(2, 'Tên danh mục tối thiểu 2 ký tự').max(100),
});

const updateCategorySchema = z.object({
  name: z.string().trim().min(2, 'Tên danh mục tối thiểu 2 ký tự').max(100),
});

const categoryParamsSchema = z.object({
  id: z.coerce.number().int().positive('ID danh mục phải là số nguyên dương'),
});

// ─── Tag schemas ──────────────────────────────────────────────────────────────

const createTagSchema = z.object({
  name: z.string().trim().min(2, 'Tên tag tối thiểu 2 ký tự').max(100),
});

const tagParamsSchema = z.object({
  id: z.coerce.number().int().positive('ID tag phải là số nguyên dương'),
});

const tagSearchSchema = z.object({
  q: z.string().trim().min(1).max(50),
  limit: z.coerce.number().int().min(1).max(50).optional().default(10),
});

module.exports = {
  createPostSchema,
  updatePostSchema,
  postQuerySchema,
  postParamsSchema,
  postSlugParamsSchema,
  schedulePostSchema,
  createCategorySchema,
  updateCategorySchema,
  categoryParamsSchema,
  createTagSchema,
  tagParamsSchema,
  tagSearchSchema,
};
