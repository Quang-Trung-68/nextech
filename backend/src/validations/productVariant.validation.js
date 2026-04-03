const { z } = require('zod');

const attributeValueInputSchema = z.object({
  value: z.string().min(1).max(200).trim(),
  position: z.coerce.number().int().min(0).optional(),
});

const attributeInputSchema = z.object({
  name: z.string().min(1).max(120).trim(),
  position: z.coerce.number().int().min(0).optional(),
  values: z.array(attributeValueInputSchema).min(1, 'Mỗi thuộc tính cần ít nhất 1 giá trị'),
});

const upsertAttributesBodySchema = z.object({
  attributes: z.array(attributeInputSchema).min(1, 'Cần ít nhất 1 thuộc tính'),
});

const variantUpsertRowSchema = z.object({
  attributeValueIds: z.array(z.string().cuid()).min(1),
  price: z.coerce.number().positive(),
  stock: z.coerce.number().int().min(0),
  imageUrl: z.union([z.string().url(), z.literal(''), z.null()]).optional(),
  salePrice: z.coerce.number().positive().optional().nullable(),
  saleExpiresAt: z.union([z.string(), z.literal(''), z.null()]).optional(),
  saleStock: z.coerce.number().int().min(1).optional().nullable(),
});

const upsertVariantsBodySchema = z.object({
  variants: z.array(variantUpsertRowSchema).min(1),
});

const updateVariantBodySchema = z
  .object({
    sku: z.string().min(3).max(80).trim().optional(),
    price: z.coerce.number().positive().optional(),
    stock: z.coerce.number().int().min(0).optional(),
    imageUrl: z.union([z.string().url(), z.literal(''), z.null()]).optional(),
    salePrice: z.coerce.number().positive().optional().nullable(),
    saleExpiresAt: z.union([z.string(), z.literal(''), z.null()]).optional(),
    saleStock: z.coerce.number().int().min(1).optional().nullable(),
    saleSoldCount: z.coerce.number().int().min(0).optional(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: 'Cần ít nhất một trường để cập nhật' });

const productIdParamsSchema = z.object({
  id: z.string().cuid('ID sản phẩm không hợp lệ'),
});

const productVariantParamsSchema = z.object({
  id: z.string().cuid('ID sản phẩm không hợp lệ'),
  variantId: z.string().cuid('ID biến thể không hợp lệ'),
});

module.exports = {
  upsertAttributesBodySchema,
  upsertVariantsBodySchema,
  updateVariantBodySchema,
  productIdParamsSchema,
  productVariantParamsSchema,
};
