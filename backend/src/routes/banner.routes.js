const express = require('express');
const router = express.Router();
const bannerController = require('../controllers/banner.controller');

router.get('/active', bannerController.getActiveBanners);

module.exports = router;
