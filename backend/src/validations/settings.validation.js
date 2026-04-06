const { z } = require('zod');

const shopSettingsSchema = z.object({
  shopName:    z.string().min(1).optional(),
  shopAddress: z.string().optional(),
  taxCode:     z.string().optional(),
  bankAccount: z.string().optional(),
  phone:       z.string().optional(),
  email:       z.string().email().optional(),
  vatRate:     z
    .number()
    .min(0, 'VAT không được âm')
    .max(1, 'VAT nhập dạng thập phân, vd: 0.10 cho 10%')
    .optional(),
  lowOrderAlertEnabled: z.boolean().optional(),
  lowOrderAlertThreshold: z
    .number()
    .int()
    .min(0, 'Ngưỡng không được âm')
    .max(999999, 'Ngưỡng quá lớn')
    .optional(),
  lowOrderAlertInterval: z.enum(['HOURLY', 'DAILY', 'MONTHLY']).optional(),
});

module.exports = {
  shopSettingsSchema,
};
