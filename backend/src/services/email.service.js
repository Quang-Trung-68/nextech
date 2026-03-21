const nodemailer = require('nodemailer');
const ejs = require('ejs');
const path = require('path');
const mailerConfig = require('../configs/mailer.config');

// ─── Transport ────────────────────────────────────────────────────────────────

const transporter = nodemailer.createTransport(mailerConfig);

// ─── Template renderer ────────────────────────────────────────────────────────

/**
 * Render an EJS template to an HTML string.
 * @param {string} templateName  — file name without extension, e.g. 'verifyEmail'
 * @param {object} data          — variables passed to the template
 * @returns {Promise<string>}    — rendered HTML
 */
const _renderTemplate = (templateName, data) => {
  const templatePath = path.join(__dirname, '../templates', `${templateName}.ejs`);
  return ejs.renderFile(templatePath, {
    appName: process.env.APP_NAME || 'NexTech',
    ...data,
  });
};

const APP = () => process.env.APP_NAME || 'NexTech';
const FROM = () => `"${APP()}" <${process.env.GMAIL_USER}>`;

// ─── Email Service ────────────────────────────────────────────────────────────

const EmailService = {
  async sendVerificationEmail(to, { name, verifyUrl }) {
    const html = await _renderTemplate('verifyEmail', { name, verifyUrl });
    await transporter.sendMail({
      from: FROM(),
      to,
      subject: `[${APP()}] Xác thực tài khoản của bạn`,
      html,
    });
  },

  async sendPasswordChangedEmail(to, { name }) {
    const html = await _renderTemplate('passwordChanged', { name });
    await transporter.sendMail({
      from: FROM(),
      to,
      subject: `[${APP()}] Mật khẩu của bạn đã được thay đổi`,
      html,
    });
  },

  async sendPasswordResetEmail(to, { name, resetUrl }) {
    const html = await _renderTemplate('resetPassword', { name, resetUrl });
    await transporter.sendMail({
      from: FROM(),
      to,
      subject: `[${APP()}] Đặt lại mật khẩu`,
      html,
    });
  },

  async sendOrderConfirmationEmail(to, { name, order }) {
    const html = await _renderTemplate('orderConfirmation', {
      name,
      order,
      appUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
    });
    const info = await transporter.sendMail({
      from: FROM(),
      to,
      subject: `[${APP()}] Xác nhận đơn hàng #${String(order.id).slice(-8).toUpperCase()}`,
      html,
    });
    console.log(`[EmailService] Order confirmation sent to ${to} for order ${order.id}. Message ID: ${info.messageId}`);
  },

  async sendOrderShippedEmail(to, { user, order }) {
    const html = await _renderTemplate('orderShipped', { user, order });
    await transporter.sendMail({
      from: FROM(),
      to,
      subject: `[${APP()}] Đơn hàng đang giao! 🚚`,
      html,
    });
  },

  async sendOrderProcessingEmail(to, { user, order }) {
    const html = await _renderTemplate('orderProcessing', { user, order });
    await transporter.sendMail({
      from: FROM(),
      to,
      subject: `[${APP()}] Đơn hàng đang được xử lý! 📦`,
      html,
    });
  },

  async sendOrderDeliveredEmail(to, { user, order }) {
    const html = await _renderTemplate('orderDelivered', { user, order });
    await transporter.sendMail({
      from: FROM(),
      to,
      subject: `[${APP()}] Đơn hàng đã giao thành công! ✅`,
      html,
    });
  },

  async sendOrderCancelledEmail(to, { user, order, cancelReason, requiresManualRefund }) {
    const html = await _renderTemplate('orderCancelled', {
      user,
      order,
      cancelReason: cancelReason || null,
      requiresManualRefund: requiresManualRefund || false,
    });
    await transporter.sendMail({
      from: FROM(),
      to,
      subject: `[${APP()}] Đơn hàng #${String(order.id).slice(-8).toUpperCase()} đã bị hủy ❌`,
      html,
    });
  },

  /**
   * Gửi email hóa đơn VAT kèm file PDF đính kèm.
   *
   * @param {string} toEmail
   * @param {import('@prisma/client').Invoice} invoice
   * @param {Buffer} pdfBuffer
   */
  async sendInvoiceEmail(toEmail, invoice, pdfBuffer) {
    const { format } = require('date-fns');
    const formatDate = (d) => d ? format(new Date(d), 'dd/MM/yyyy') : '';
    const formatVND = (amount) => Math.round(Number(amount)).toLocaleString('vi-VN') + ' đ';

    const html = await _renderTemplate('invoice-email', {
      invoiceNumber: invoice.invoiceNumber,
      buyerName: invoice.buyerName,
      totalAmount: formatVND(invoice.totalAmount),
      issuedAt: formatDate(invoice.issuedAt),
      orderLink: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/orders`,
    });

    await transporter.sendMail({
      from: FROM(),
      to: toEmail,
      subject: `[${APP()}] Hóa đơn mua hàng ${invoice.invoiceNumber}`,
      html,
      attachments: [
        {
          filename: `${invoice.invoiceNumber}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    });

    console.log(`[EmailService] Invoice email sent to ${toEmail} for invoice ${invoice.invoiceNumber}`);
  },
};

module.exports = EmailService;
