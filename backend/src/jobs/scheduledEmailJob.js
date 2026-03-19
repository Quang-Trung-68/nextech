const cron = require('node-cron');
const EmailService = require('../services/email.service');

const prisma = require('../utils/prisma');
const MAX_RETRIES = 3;

// Job: retryFailedEmails
// Cron schedule: mỗi 30 phút
cron.schedule('*/30 * * * *', async () => {
  try {
    const failedEmails = await prisma.failedEmail.findMany({
      where: { status: 'FAILED' }
    });

    if (failedEmails.length === 0) return;

    let successCount = 0;
    let retryingCount = 0;
    let deadCount = 0;

    for (const record of failedEmails) {
      try {
        if (record.type === 'VERIFY_EMAIL') {
          await EmailService.sendVerificationEmail(record.to, record.data);
        } else if (record.type === 'RESET_PASSWORD') {
          await EmailService.sendPasswordResetEmail(record.to, record.data);
        } else if (record.type === 'ORDER_CONFIRMATION') {
          await EmailService.sendOrderConfirmationEmail(record.to, record.data);
        } else if (record.type === 'PASSWORD_CHANGED') {
          await EmailService.sendPasswordChangedEmail(record.to, record.data);
        } else if (record.type === 'ORDER_SHIPPED') {
          await EmailService.sendOrderShippedEmail(record.to, record.data);
        } else if (record.type === 'ORDER_DELIVERED') {
          await EmailService.sendOrderDeliveredEmail(record.to, record.data);
        } else {
          throw new Error('Unknown email type: ' + record.type);
        }

        // Nếu gửi THÀNH CÔNG:
        await prisma.failedEmail.update({
          where: { id: record.id },
          data: { status: 'RESOLVED', resolvedAt: new Date() }
        });
        successCount++;
        
      } catch (err) {
        // Nếu vẫn THẤT BẠI:
        const newAttempts = record.attempts + 1;
        if (newAttempts >= MAX_RETRIES) {
          // Hết hi vọng — đánh dấu DEAD
          await prisma.failedEmail.update({
            where: { id: record.id },
            data: { status: 'DEAD', attempts: newAttempts, lastError: String(err.message) }
          });
          console.warn(`[ScheduledEmailJob] Email marked DEAD — type=${record.type} to=${record.to}`);
          deadCount++;
        } else {
          // Còn lượt retry — giữ FAILED, tăng attempts
          await prisma.failedEmail.update({
            where: { id: record.id },
            data: { attempts: newAttempts, lastError: String(err.message) }
          });
          retryingCount++;
        }
      }
    }

    console.info(`[ScheduledEmailJob] Done — success: ${successCount} | retrying: ${retryingCount} | dead: ${deadCount}`);
  } catch (err) {
    console.error(`[ScheduledEmailJob] Failed to run retry task:`, err);
  }
});

// ─── SCHEDULED EMAIL JOBS (future) ──────────────────────────
// TODO: Thêm các cron job gửi mail định kỳ tại đây
// Ví dụ: nhắc nhở đơn hàng, báo cáo doanh thu hàng tuần, v.v.
// cron.schedule('0 8 * * 1', () => { ... })
