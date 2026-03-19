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
    appName: process.env.APP_NAME || 'MyShop',
    ...data,
  });
};

// ─── Email Service ────────────────────────────────────────────────────────────

const EmailService = {
  async sendVerificationEmail(to, { name, verifyUrl }) {
    const html = await _renderTemplate('verifyEmail', { name, verifyUrl });
    await transporter.sendMail({
      from: `"${process.env.APP_NAME || 'MyShop'}" <${process.env.GMAIL_USER}>`,
      to,
      subject: 'Xác thực tài khoản của bạn',
      html,
    });
  },

  async sendPasswordChangedEmail(to, { name }) {
    const html = await _renderTemplate('passwordChanged', { name });
    await transporter.sendMail({
      from: `"${process.env.APP_NAME || 'MyShop'}" <${process.env.GMAIL_USER}>`,
      to,
      subject: 'Mật khẩu của bạn đã được thay đổi',
      html,
    });
  },

  async sendPasswordResetEmail(to, { name, resetUrl }) {
    const html = await _renderTemplate('resetPassword', { name, resetUrl });
    await transporter.sendMail({
      from: `"${process.env.APP_NAME || 'MyShop'}" <${process.env.GMAIL_USER}>`,
      to,
      subject: 'Đặt lại mật khẩu',
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
      from: `"${process.env.APP_NAME || 'MyShop'}" <${process.env.GMAIL_USER}>`,
      to,
      subject: `[${process.env.APP_NAME || 'MyShop'}] Xác nhận đơn hàng #${order.id}`,
      html,
    });
    console.log(`[EmailService] Order confirmation sent to ${to} for order ${order.id}. Message ID: ${info.messageId}`);
  },

  async sendOrderShippedEmail(to, { user, order }) {
    const html = await _renderTemplate('orderShipped', { user, order });
    await transporter.sendMail({
      from: `"${process.env.APP_NAME || 'MyShop'}" <${process.env.GMAIL_USER}>`,
      to,
      subject: 'Đơn hàng đang giao! 🚚',
      html,
    });
  },

  async sendOrderProcessingEmail(to, { user, order }) {
    const html = await _renderTemplate('orderProcessing', { user, order });
    await transporter.sendMail({
      from: `"${process.env.APP_NAME || 'MyShop'}" <${process.env.GMAIL_USER}>`,
      to,
      subject: 'Đơn hàng đang được xử lý! 📦',
      html,
    });
  },

  async sendOrderDeliveredEmail(to, { user, order }) {
    const html = await _renderTemplate('orderDelivered', { user, order });
    await transporter.sendMail({
      from: `"${process.env.APP_NAME || 'MyShop'}" <${process.env.GMAIL_USER}>`,
      to,
      subject: 'Đơn hàng đã giao thành công! ✅',
      html,
    });
  }
};

module.exports = EmailService;
