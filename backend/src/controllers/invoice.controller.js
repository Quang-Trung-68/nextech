const InvoiceService = require('../services/invoice.service');
const PdfService = require('../services/pdf.service');

/**
 * GET /api/admin/invoices/:invoiceId
 * Xem chi tiết hóa đơn (JSON đầy đủ include items).
 */
const getDetail = async (req, res, next) => {
  try {
    const invoice = await InvoiceService.getInvoiceById(req.params.invoiceId);
    res.status(200).json({ success: true, invoice });
  } catch (error) {
    next(error);
  }
};

const getByOrderId = async (req, res, next) => {
  try {
    const invoice = await InvoiceService.getInvoiceByOrderId(req.params.orderId);
    if (!invoice) return res.status(404).json({ message: 'Chưa có hóa đơn cho đơn hàng này' });
    res.json({ data: invoice });
  } catch (err) { next(err); }
};

const createManual = async (req, res, next) => {
  try {
    const invoice = await InvoiceService.createDraftInvoice(
      req.params.orderId,
      Object.keys(req.body).length ? req.body : null
    );
    res.status(201).json({ data: invoice });
  } catch (err) { next(err); }
};

const issue = async (req, res, next) => {
  try {
    const invoice = await InvoiceService.issueInvoice(req.params.invoiceId);
    res.json({ data: invoice });
  } catch (err) { next(err); }
};

const cancel = async (req, res, next) => {
  try {
    const invoice = await InvoiceService.cancelInvoice(req.params.invoiceId);
    res.json({ data: invoice });
  } catch (err) { next(err); }
};

/**
 * GET /api/admin/invoices/:invoiceId/pdf
 * Tải file PDF hóa đơn — stream trực tiếp về client.
 */
const downloadPdf = async (req, res, next) => {
  try {
    const invoice = await InvoiceService.getInvoiceById(req.params.invoiceId);
    const pdfBuffer = await PdfService.generateBuffer(invoice);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${invoice.invoiceNumber}.pdf"`
    );
    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/admin/invoices/:invoiceId/resend
 * Gửi lại email hóa đơn cho user.
 */
const resendEmail = async (req, res, next) => {
  try {
    await InvoiceService.resendInvoiceEmail(req.params.invoiceId);
    res.status(200).json({ success: true, message: 'Đã gửi lại hóa đơn thành công' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getDetail, downloadPdf, resendEmail, getByOrderId, createManual, issue, cancel };
