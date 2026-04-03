const productVariantService = require('../services/productVariant.service');

const getAttributes = async (req, res, next) => {
  try {
    const data = await productVariantService.getAttributes(req.params.id);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const upsertAttributes = async (req, res, next) => {
  try {
    const data = await productVariantService.upsertAttributes(req.params.id, req.body);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const getVariants = async (req, res, next) => {
  try {
    const data = await productVariantService.getVariants(req.params.id);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const upsertVariants = async (req, res, next) => {
  try {
    const data = await productVariantService.upsertVariants(req.params.id, req.body);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const updateVariant = async (req, res, next) => {
  try {
    const data = await productVariantService.updateVariantByAdmin(
      req.params.id,
      req.params.variantId,
      req.body
    );
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const deleteVariant = async (req, res, next) => {
  try {
    const data = await productVariantService.deleteVariantByAdmin(req.params.id, req.params.variantId);
    res.status(200).json({ success: true, ...data });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAttributes,
  upsertAttributes,
  getVariants,
  upsertVariants,
  updateVariant,
  deleteVariant,
};
