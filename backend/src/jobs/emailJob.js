const EmailService = require('../services/email.service');
const prisma = require('../utils/prisma');
const InvoiceService = require('../services/invoice.service');
const PdfService = require('../services/pdf.service');

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

const dispatchOrderCancelledEmail = (to, data) => {
  sendWithRetry('ORDER_CANCELLED', to, data, () => EmailService.sendOrderCancelledEmail(to, data));
};

/**
 * Dispatch job gửi hóa đơn cho user sau khi Order chuyển sang DELIVERED.
 * Fire-and-forget — không await. Thứ tự:
 *   1. issueInvoice (status → ISSUED, issuedAt = now)
 *   2. generateBuffer (PDF)
 *   3. sendInvoiceEmail (gửi email kèm PDF)
 *   4. cập nhật emailSentAt
 *
 * @param {string} invoiceId
 */
const dispatchInvoiceEmail = (invoiceId) => {
  (async () => {
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        // Bước 1: issue invoice
        const invoice = await InvoiceService.issueInvoice(invoiceId);

        // Bước 2: tạo PDF buffer
        const pdfBuffer = await PdfService.generateBuffer(invoice);

        // Bước 3: gửi email kèm PDF
        await EmailService.sendInvoiceEmail(invoice.buyerEmail, invoice, pdfBuffer);

        // Bước 4: cập nhật emailSentAt
        await prisma.invoice.update({
          where: { id: invoiceId },
          data: { emailSentAt: new Date() },
        });

        console.log(`[EmailJob] Invoice email sent successfully for invoiceId=${invoiceId}`);
        return;
      } catch (err) {
        if (attempt < MAX_RETRIES) {
          await sleep(RETRY_DELAYS[attempt]);
        } else {
          console.error(
            `[EmailJob] Failed to send invoice email invoiceId=${invoiceId} after ${MAX_RETRIES} retries. Error:`,
            err.message
          );
          try {
            await prisma.failedEmail.create({
              data: {
                type: 'INVOICE',
                to: invoiceId,
                data: { invoiceId },
                attempts: MAX_RETRIES,
                lastError: String(err.message),
                status: 'FAILED',
              },
            });
          } catch (dbErr) {
            console.error(`[EmailJob] Error saving failed invoice email:`, dbErr.message);
          }
        }
      }
    }
  })();
};

module.exports = {
  dispatchVerificationEmail,
  dispatchResetPasswordEmail,
  dispatchOrderConfirmationEmail,
  dispatchPasswordChangedEmail,
  dispatchOrderProcessingEmail,
  dispatchOrderShippedEmail,
  dispatchOrderDeliveredEmail,
  dispatchOrderCancelledEmail,
  dispatchInvoiceEmail,
};
