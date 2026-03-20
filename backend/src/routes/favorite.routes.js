const express = require('express');
const { protect } = require('../middleware/auth');
const favoriteController = require('../controllers/favorite.controller');

const router = express.Router();

router.use(protect); // All favorite routes require authentication

router.get('/', favoriteController.getMyFavorites);
router.post('/:productId', favoriteController.toggleFavorite);

module.exports = router;
