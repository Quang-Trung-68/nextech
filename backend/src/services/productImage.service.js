const prisma = require('../utils/prisma');
const cloudinary = require('../utils/cloudinary');
const { AppError, NotFoundError, ConflictError } = require('../errors/AppError');
const ERROR_CODES = require('../errors/errorCodes');

exports.uploadImages = async (productId, files) => {
  if (!files || files.length === 0) {
    throw new AppError('No files or invalid files uploaded', 400, ERROR_CODES.MEDIA.IMAGE_UPLOAD_FAILED);
  }

  // Check product existence
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) {
    // Rollback already uploaded files on Cloudinary
    await Promise.all(
      files.map((file) => cloudinary.uploader.destroy(file.publicId))
    );
    throw new NotFoundError('Product');
  }

  // files đã là [{ url, publicId }] từ uploadToCloudinary middleware
  const newImagesData = files.map((file) => ({
    url: file.url,
    publicId: file.publicId,
  }));

  try {
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: {
        images: {
          create: newImagesData, // Tự động tạo record trong ProductImage model
        },
      },
      include: { images: true }, // Include images detail để return
    });

    return updatedProduct;
  } catch (dbError) {
    // DB Update failed -> Rollback files uploaded to Cloudinary
    await Promise.all(
      files.map((file) => cloudinary.uploader.destroy(file.publicId))
    ).catch(err => console.error("Cloudinary rollback failed:", err));
    
    throw dbError;
  }
};

exports.deleteImages = async (productId, publicIds) => {
  const product = await prisma.product.findUnique({ 
    where: { id: productId },
    include: { images: true } 
  });

  if (!product) {
    throw new NotFoundError('Product');
  }

  const currentImages = product.images || [];

  const imagesToRemove = currentImages.filter((img) =>
    publicIds.includes(img.publicId)
  );

  // Kiểm tra xem tất cả các publicIds gửi lên có thuộc về sản phẩm này không
  if (imagesToRemove.length !== publicIds.length) {
    throw new AppError('One or more public_ids do not belong to this product', 400, ERROR_CODES.SERVER.VALIDATION_ERROR);
  }

  const imagesToKeep = currentImages.filter(
    (img) => !publicIds.includes(img.publicId)
  );

  if (imagesToKeep.length === 0) {
    throw new AppError('Product must have at least 1 image', 400, ERROR_CODES.SERVER.VALIDATION_ERROR);
  }

  // Xóa DB trước để đảm bảo tính nhất quán (tránh ảnh chết trên giao diện)
  const updatedProduct = await prisma.product.update({
    where: { id: productId },
    data: { 
      images: {
        deleteMany: {
          publicId: { in: imagesToRemove.map(img => img.publicId) }
        }
      }
    },
    include: { images: true }
  });

  // Nếu DB thành công, tiến hành xóa trên Cloudinary
  // Nếu fail ở Cloudinary thì rác trên Cloudinary, nhưng DB vẫn sạch (thà rác Cloudinary còn hơn link chết ở DB)
  Promise.all(
    imagesToRemove.map((img) => cloudinary.uploader.destroy(img.publicId))
  ).catch(err => console.error("Could not destroy images on Cloudinary:", err));

  return updatedProduct;
};
