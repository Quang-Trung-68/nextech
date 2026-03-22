const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/auth');
const AdminInvoiceController = require('../controllers/invoice.controller');

// Tất cả route tại đây đều yêu cầu đăng nhập + role ADMIN
router.use(protect, restrictTo('ADMIN'));

// GET /api/admin/invoices/:invoiceId — xem chi tiết hóa đơn (JSON)
router.get('/:invoiceId', AdminInvoiceController.getDetail);

// GET /api/admin/invoices/:invoiceId/pdf — tải PDF
router.get('/:invoiceId/pdf', AdminInvoiceController.downloadPdf);

// POST /api/admin/invoices/:invoiceId/resend — gửi lại email hóa đơn
router.post('/:invoiceId/resend', AdminInvoiceController.resendEmail);

// PATCH /api/admin/invoices/:invoiceId/issue — Chuyển DRAFT -> ISSUED
router.patch('/:invoiceId/issue', AdminInvoiceController.issue);

// PATCH /api/admin/invoices/:invoiceId/cancel — Hủy invoice
router.patch('/:invoiceId/cancel', AdminInvoiceController.cancel);

module.exports = router;
