const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../../middleware/auth');
const AdminInvoiceController = require('../../controllers/admin/invoice.controller');

// Tất cả route tại đây đều yêu cầu đăng nhập + role ADMIN
router.use(protect, restrictTo('ADMIN'));

// GET /api/admin/invoices/:invoiceId — xem chi tiết hóa đơn (JSON)
router.get('/:invoiceId', AdminInvoiceController.getDetail);

// GET /api/admin/invoices/:invoiceId/pdf — tải PDF (stream trực tiếp về client)
router.get('/:invoiceId/pdf', AdminInvoiceController.downloadPdf);

// POST /api/admin/invoices/:invoiceId/resend — gửi lại email hóa đơn cho user
router.post('/:invoiceId/resend', AdminInvoiceController.resendEmail);

module.exports = router;
