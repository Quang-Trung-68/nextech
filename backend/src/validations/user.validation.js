const { z } = require('zod');

const vnPhoneRegex = /^(0[3|5|7|8|9])[0-9]{8}$/;

const updateProfileSchema = z.object({
  name: z
    .string({ required_error: 'Họ tên là bắt buộc.' })
    .min(2, 'Họ tên phải có ít nhất 2 ký tự.'),
  phone: z
    .string()
    .regex(vnPhoneRegex, 'Số điện thoại không hợp lệ (10 số, bắt đầu bằng 0).')
    .optional()
    .or(z.literal('')),
});

const createAddressSchema = z.object({
  fullName: z
    .string({ required_error: 'Họ tên người nhận là bắt buộc.' })
    .min(2, 'Họ tên phải có ít nhất 2 ký tự.'),
  phone: z
    .string({ required_error: 'Số điện thoại là bắt buộc.' })
    .regex(vnPhoneRegex, 'Số điện thoại không hợp lệ.'),
  address: z
    .string({ required_error: 'Địa chỉ là bắt buộc.' })
    .min(5, 'Địa chỉ phải có ít nhất 5 ký tự.'),
  city: z
    .string({ required_error: 'Thành phố là bắt buộc.' })
    .min(2, 'Thành phố phải có ít nhất 2 ký tự.'),
  isDefault: z.boolean().optional(),
});

const updateAddressSchema = createAddressSchema.partial();

const addressParamsSchema = z.object({
  id: z.string().min(1, 'ID địa chỉ không hợp lệ.'),
});

module.exports = {
  updateProfileSchema,
  createAddressSchema,
  updateAddressSchema,
  addressParamsSchema,
};
