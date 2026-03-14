const { z } = require('zod');

const deleteImagesSchema = z.object({
  public_ids: z.array(z.string().min(1, 'Public ID không được rỗng'))
    .min(1, 'Vui lòng cung cấp ít nhất 1 public_id để xoá')
});

module.exports = {
  deleteImagesSchema
};
