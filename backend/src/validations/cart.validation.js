const { z } = require('zod');

/**
 * Schema validate body cho POST /cart/items (thêm sản phẩm vào giỏ)
 */
const addToCartSchema = z.object({
  productId: z.string().cuid('ID sản phẩm không hợp lệ'),

  quantity: z.coerce
    .number()
    .int('Số lượng phải là số nguyên')
    .min(1, 'Số lượng tối thiểu là 1')
    .max(100, 'Số lượng tối đa là 100 mỗi lần thêm'),
});

/**
 * Schema validate body cho PUT /cart/items/:productId (cập nhật số lượng)
 * Cho phép quantity = 0 để xóa item khỏi giỏ
 */
const updateCartItemSchema = z.object({
  quantity: z.coerce
    .number()
    .int('Số lượng phải là số nguyên')
    .min(0, 'Số lượng không được âm'),
});

/**
 * Schema validate req.params cho các route có :productId
 */
const cartParamsSchema = z.object({
  productId: z.string().cuid('ID sản phẩm không hợp lệ'),
});

module.exports = { addToCartSchema, updateCartItemSchema, cartParamsSchema };
