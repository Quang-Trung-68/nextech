// utils/mailer.js — deprecated, sẽ xóa sau
// Giữ lại để tránh import error trong quá trình chuyển đổi
const EmailService = require('../services/email.service');

module.exports = {
  sendVerificationEmail: (to, name, verifyUrl) => EmailService.sendVerificationEmail(to, { name, verifyUrl }),
  sendPasswordChangedEmail: (to, name) => EmailService.sendPasswordChangedEmail(to, { name }),
  sendPasswordResetEmail: (to, name, resetUrl) => EmailService.sendPasswordResetEmail(to, { name, resetUrl }),
  sendOrderConfirmationEmail: (order) => EmailService.sendOrderConfirmationEmail(order.user.email, { name: order.user?.name, order }),
};
