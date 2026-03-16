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

// ─── Mail senders ─────────────────────────────────────────────────────────────

/**
 * Send an email verification link to a newly registered user.
 * @param {string} to         — recipient email
 * @param {string} name       — user's display name
 * @param {string} verifyUrl  — full URL containing the raw token
 */
const sendVerificationEmail = async (to, name, verifyUrl) => {
  try {
    const html = await _renderTemplate('verifyEmail', { name, verifyUrl });
    await transporter.sendMail({
      from: `"${process.env.APP_NAME || 'MyShop'}" <${process.env.GMAIL_USER}>`,
      to,
      subject: 'Xác thực tài khoản của bạn',
      html,
    });
  } catch (err) {
    console.error('[Mailer] sendVerificationEmail failed:', err.message);
  }
};

/**
 * Notify a user that their password was successfully changed.
 * @param {string} to    — recipient email
 * @param {string} name  — user's display name
 */
const sendPasswordChangedEmail = async (to, name) => {
  try {
    const html = await _renderTemplate('passwordChanged', { name });
    await transporter.sendMail({
      from: `"${process.env.APP_NAME || 'MyShop'}" <${process.env.GMAIL_USER}>`,
      to,
      subject: 'Mật khẩu của bạn đã được thay đổi',
      html,
    });
  } catch (err) {
    console.error('[Mailer] sendPasswordChangedEmail failed:', err.message);
  }
};

/**
 * Send a password reset link to a user who requested it.
 * @param {string} to        — recipient email
 * @param {string} name      — user's display name
 * @param {string} resetUrl  — full URL containing the raw token
 */
const sendPasswordResetEmail = async (to, name, resetUrl) => {
  try {
    const html = await _renderTemplate('resetPassword', { name, resetUrl });
    await transporter.sendMail({
      from: `"${process.env.APP_NAME || 'MyShop'}" <${process.env.GMAIL_USER}>`,
      to,
      subject: 'Đặt lại mật khẩu',
      html,
    });
  } catch (err) {
    console.error('[Mailer] sendPasswordResetEmail failed:', err.message);
  }
};

/**
 * Send an order confirmation email after an order is successfully created.
 * @param {object} order  — Prisma Order object with `user` and `orderItems.product` included
 */
const sendOrderConfirmationEmail = async (order) => {
  try {
    const html = await _renderTemplate('orderConfirmation', {
      order,
      appUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
    });
    const info = await transporter.sendMail({
      from: `"${process.env.APP_NAME || 'MyShop'}" <${process.env.GMAIL_USER}>`,
      to: order.user.email,
      subject: `[${process.env.APP_NAME || 'MyShop'}] Xác nhận đơn hàng #${order.id}`,
      html,
    });
    console.log(`[Mailer] Order confirmation sent to ${order.user.email} for order ${order.id}. Message ID: ${info.messageId}`);
  } catch (err) {
    // Không throw để tránh block luồng tạo đơn hàng
    console.error('[Mailer] sendOrderConfirmationEmail failed:', err.message);
  }
};

module.exports = {
  sendVerificationEmail,
  sendPasswordChangedEmail,
  sendPasswordResetEmail,
  sendOrderConfirmationEmail,
};
