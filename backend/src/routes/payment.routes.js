const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');

// Không cần body-parser (sẽ được mount trực tiếp `express.raw` tại index.js)
router.post('/', paymentController.handleWebhook);

module.exports = router;
