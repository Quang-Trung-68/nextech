const favoriteService = require('../services/favorite.service');

const toggleFavorite = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!productId) {
      return res.status(400).json({ success: false, message: 'productId is required' });
    }

    const result = await favoriteService.toggleFavorite(req.user.id, productId);

    return res.status(200).json({
      success: true,
      favorited: result.favorited,
    });
  } catch (error) {
    if (error.statusCode === 404) {
      return res.status(404).json({ success: false, message: error.message });
    }
    console.error('toggleFavorite Error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

const getMyFavorites = async (req, res) => {
  try {
    const data = await favoriteService.getUserFavorites(req.user.id);

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('getMyFavorites Error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

module.exports = {
  toggleFavorite,
  getMyFavorites,
};
