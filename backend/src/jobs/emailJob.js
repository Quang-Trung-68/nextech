const EmailService = require('../services/email.service');
const prisma = require('../utils/prisma');

const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 3000, 5000]; // ms

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const sendWithRetry = async (type, to, data, sendFn) => {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      await sendFn();
      return; // Thành công thì thoát
    } catch (err) {
      if (attempt < MAX_RETRIES) {
        // Có thể retry
        await sleep(RETRY_DELAYS[attempt]);
      } else {
        // Hết lượt retry
        console.error(`[EmailJob] Failed to send email type=${type} to=${to} after ${MAX_RETRIES} retries. Error:`, err.message);
        try {
          await prisma.failedEmail.create({
            data: {
              type,
              to,
              data: data || {},
              attempts: MAX_RETRIES,
              lastError: String(err.message),
              status: 'FAILED',
            }
          });
          console.error(`[EmailJob] Saved failed email type=${type} to=${to}`);
        } catch (dbErr) {
          console.error(`[EmailJob] Error saving to failed emails:`, dbErr);
        }
      }
    }
  }
};

const dispatchVerificationEmail = (to, data) => {
  sendWithRetry('VERIFY_EMAIL', to, data, () => EmailService.sendVerificationEmail(to, data));
};

const dispatchResetPasswordEmail = (to, data) => {
  sendWithRetry('RESET_PASSWORD', to, data, () => EmailService.sendPasswordResetEmail(to, data));
};

const dispatchOrderConfirmationEmail = (to, data) => {
  sendWithRetry('ORDER_CONFIRMATION', to, data, () => EmailService.sendOrderConfirmationEmail(to, data));
};

const dispatchPasswordChangedEmail = (to, data) => {
  sendWithRetry('PASSWORD_CHANGED', to, data, () => EmailService.sendPasswordChangedEmail(to, data));
};

const dispatchOrderShippedEmail = (to, data) => {
  sendWithRetry('ORDER_SHIPPED', to, data, () => EmailService.sendOrderShippedEmail(to, data));
};

const dispatchOrderProcessingEmail = (to, data) => {
  sendWithRetry('ORDER_PROCESSING', to, data, () => EmailService.sendOrderProcessingEmail(to, data));
};

const dispatchOrderDeliveredEmail = (to, data) => {
  sendWithRetry('ORDER_DELIVERED', to, data, () => EmailService.sendOrderDeliveredEmail(to, data));
};

module.exports = {
  dispatchVerificationEmail,
  dispatchResetPasswordEmail,
  dispatchOrderConfirmationEmail,
  dispatchPasswordChangedEmail,
  dispatchOrderProcessingEmail,
  dispatchOrderShippedEmail,
  dispatchOrderDeliveredEmail,
};
