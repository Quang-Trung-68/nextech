const express = require('express');
const router = express.Router();
const tagController = require('../controllers/tag.controller');
const { protect, restrictTo } = require('../middleware/auth');
const { adminProtect } = require('../middleware/adminAuth');
const { validate } = require('../middleware/validateRequest');
const { tagSearchSchema } = require('../validations/post.validation');

router.use(adminProtect);

router.get('/search', validate(tagSearchSchema, 'query'), tagController.searchTags);

module.exports = router;
