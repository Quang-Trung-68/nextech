const productImageService = require('../services/productImage.service');

exports.uploadImages = async (req, res, next) => {
  try {
    const productId = req.params.id;
    const files = req.files; // processed by multer

    const updatedProduct = await productImageService.uploadImages(productId, files);

    res.status(200).json({
      success: true,
      data: updatedProduct,
    });
  } catch (err) {
    next(err);
  }
};

exports.deleteImages = async (req, res, next) => {
  try {
    const productId = req.params.id;
    const { public_ids } = req.body;

    const updatedProduct = await productImageService.deleteImages(productId, public_ids);

    res.status(200).json({
      success: true,
      data: updatedProduct,
    });
  } catch (err) {
    next(err);
  }
};
