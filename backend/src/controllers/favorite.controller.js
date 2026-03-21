const favoriteService = require('../services/favorite.service');
const { AppError } = require('../errors/AppError');
const ERROR_CODES = require('../errors/errorCodes');

const toggleFavorite = async (req, res, next) => {
  try {
    const { productId } = req.params;

    if (!productId) {
      return next(new AppError('productId is required', 400, ERROR_CODES.SERVER.VALIDATION_ERROR));
    }

    const result = await favoriteService.toggleFavorite(req.user.id, productId);

    return res.status(200).json({
      success: true,
      favorited: result.favorited,
    });
  } catch (error) {
    next(error);
  }
};

const getMyFavorites = async (req, res, next) => {
  try {
    const data = await favoriteService.getUserFavorites(req.user.id);

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  toggleFavorite,
  getMyFavorites,
};
