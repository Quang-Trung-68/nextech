import { z } from 'zod';

const tagSelectionSchema = z
  .object({
    selectedIds: z.array(z.number().int().positive()).max(10).default([]),
    newNames: z.array(z.string().trim().min(1).max(50)).max(10).default([]),
  })
  .superRefine((data, ctx) => {
    if (data.selectedIds.length + data.newNames.length > 10) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Tối đa 10 tags',
        path: ['newNames'],
      });
    }
  });

export const newsArticleFormSchema = z
  .object({
    title: z.string().trim().min(5, 'Tối thiểu 5 ký tự').max(200),
    categoryId: z.preprocess(
      (val) => {
        if (val === '' || val === undefined || val === null) return undefined;
        const n = Number(val);
        return Number.isFinite(n) ? n : undefined;
      },
      z.number({ invalid_type_error: 'Chọn danh mục' }).int().positive('Chọn danh mục')
    ),
    content: z.string().min(1, 'Nội dung không được để trống'),
    excerpt: z.string().max(300).optional().or(z.literal('')),
    tagSelection: tagSelectionSchema,
    coverImageUrl: z.string().url().optional().or(z.literal('')),
    scheduledAt: z.string().optional().or(z.literal('')),
  })
  .superRefine((data, ctx) => {
    const plain = data.content.replace(/<[^>]*>/g, '').trim();
    if (plain.length < 1) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Nội dung không được để trống', path: ['content'] });
    }
  });
