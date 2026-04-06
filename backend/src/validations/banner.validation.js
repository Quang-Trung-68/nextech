const { z } = require('zod');

const hexColor = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, 'Màu phải dạng hex (#RRGGBB)');

const cloudinaryUrl = z
  .string()
  .url('URL ảnh không hợp lệ')
  .refine(
    (u) => /cloudinary\.com/i.test(u) || /res\.cloudinary\.com/i.test(u),
    'Ảnh phải là URL Cloudinary'
  );

const linkUrl = z
  .string()
  .min(1, 'Đường dẫn không được để trống')
  .refine(
    (s) => s.startsWith('/') || /^https?:\/\//i.test(s),
    'Link phải là đường dẫn nội bộ (bắt đầu /) hoặc URL đầy đủ'
  );

/** Accepts ISO or datetime-local from form inputs */
const optionalDateInput = z.preprocess((v) => {
  if (v === '' || v == null || v === undefined) return undefined;
  const s = String(v).trim();
  if (!s) return undefined;
  const t = Date.parse(s);
  if (Number.isNaN(t)) return undefined;
  return new Date(t).toISOString();
}, z.string().datetime().optional());

const bannerBodyBase = {
  title: z.string().trim().min(1).max(100),
  subtitle: z.preprocess((v) => (v === '' || v == null ? undefined : v), z.string().trim().max(200).optional()),
  imageUrl: cloudinaryUrl,
  linkUrl,
  bgColor: z.preprocess((v) => (v == null || v === '' ? '#f5f5f7' : v), hexColor).optional().default('#f5f5f7'),
  textColor: z.preprocess((v) => (v == null || v === '' ? '#1d1d1f' : v), hexColor).optional().default('#1d1d1f'),
  isActive: z.preprocess((v) => {
    if (v === undefined || v === '') return true;
    if (typeof v === 'boolean') return v;
    if (v === 'true' || v === '1' || v === 'on') return true;
    if (v === 'false' || v === '0') return false;
    return Boolean(v);
  }, z.boolean().optional().default(true)),
  order: z.preprocess((v) => (v === '' || v == null ? 0 : v), z.coerce.number().int().min(0).max(9999).optional().default(0)),
  startDate: optionalDateInput,
  endDate: optionalDateInput,
};

const createBannerSchema = z
  .object(bannerBodyBase)
  .superRefine((data, ctx) => {
    if (data.startDate && data.endDate) {
      const a = new Date(data.startDate);
      const b = new Date(data.endDate);
      if (b <= a) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Ngày kết thúc phải sau ngày bắt đầu', path: ['endDate'] });
      }
    }
  });

const updateBannerSchema = z
  .object({
    title: z.string().trim().min(1).max(100).optional(),
    subtitle: z.preprocess((v) => (v === '' || v == null ? undefined : v), z.string().trim().max(200).optional()),
    imageUrl: cloudinaryUrl.optional(),
    linkUrl: linkUrl.optional(),
    bgColor: hexColor.optional(),
    textColor: hexColor.optional(),
    isActive: z.preprocess((v) => {
      if (v === undefined) return undefined;
      if (typeof v === 'boolean') return v;
      if (v === 'true' || v === '1' || v === 'on') return true;
      if (v === 'false' || v === '0') return false;
      return Boolean(v);
    }, z.boolean().optional()),
    order: z.preprocess((v) => (v === '' || v == null ? undefined : v), z.coerce.number().int().min(0).max(9999).optional()),
    startDate: z.preprocess((v) => {
      if (v === '' || v == null || v === undefined) return null;
      const t = Date.parse(String(v));
      return Number.isNaN(t) ? null : new Date(t).toISOString();
    }, z.union([z.string().datetime(), z.null()]).optional()),
    endDate: z.preprocess((v) => {
      if (v === '' || v == null || v === undefined) return null;
      const t = Date.parse(String(v));
      return Number.isNaN(t) ? null : new Date(t).toISOString();
    }, z.union([z.string().datetime(), z.null()]).optional()),
  })
  .superRefine((data, ctx) => {
    if (data.startDate && data.endDate) {
      const a = new Date(data.startDate);
      const b = new Date(data.endDate);
      if (b <= a) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Ngày kết thúc phải sau ngày bắt đầu', path: ['endDate'] });
      }
    }
  });

const bannerIdParamsSchema = z.object({
  id: z.string().cuid('ID banner không hợp lệ'),
});

module.exports = {
  createBannerSchema,
  updateBannerSchema,
  bannerIdParamsSchema,
};
