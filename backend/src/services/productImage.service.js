const prisma = require('../utils/prisma');
const cloudinary = require('../utils/cloudinary');

exports.uploadImages = async (productId, files) => {
  if (!files || files.length === 0) {
    const error = new Error('Không có file hoặc file không hợp lệ');
    error.statusCode = 400;
    throw error;
  }

  // Check product existence
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) {
    // Rollback already uploaded files on Cloudinary
    await Promise.all(
      files.map((file) => cloudinary.uploader.destroy(file.filename))
    );
    const error = new Error('Không tìm thấy sản phẩm');
    error.statusCode = 404;
    throw error;
  }

  // Prepare objects for Prisma 'create' relation
  const newImagesData = files.map((file) => ({
    url: file.path,           // Cloudinary URL
    publicId: file.filename,  // Cloudinary public_id
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
      files.map((file) => cloudinary.uploader.destroy(file.filename))
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
    const error = new Error('Không tìm thấy sản phẩm');
    error.statusCode = 404;
    throw error;
  }

  const currentImages = product.images || [];

  const imagesToRemove = currentImages.filter((img) =>
    publicIds.includes(img.publicId)
  );

  // Kiểm tra xem tất cả các publicIds gửi lên có thuộc về sản phẩm này không
  if (imagesToRemove.length !== publicIds.length) {
    const error = new Error('Một hoặc nhiều public_id không thuộc về sản phẩm này');
    error.statusCode = 400;
    throw error;
  }

  const imagesToKeep = currentImages.filter(
    (img) => !publicIds.includes(img.publicId)
  );

  if (imagesToKeep.length === 0) {
    const error = new Error('Sản phẩm phải có ít nhất 1 ảnh');
    error.statusCode = 400;
    throw error;
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
