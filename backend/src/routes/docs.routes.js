/**
 * docs.routes.js
 * Cấu hình route hiển thị Scalar API Reference.
 */

const express = require('express');
const router = express.Router();
const { apiReference } = require('@scalar/express-api-reference');
const openApiSpec = require('../docs/openapi');

router.use(
  '/',
  apiReference({
    theme: 'purple', // Các theme khả dụng: 'default', 'purple', 'blue', 'green', 'deepSpace', 'saturn'
    spec: {
      content: () => openApiSpec, // Pass as a function or object
    },
  })
);

module.exports = router;
