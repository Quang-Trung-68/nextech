const { startOfDay, endOfDay, format } = require('date-fns');

/**
 * Sinh số hóa đơn theo format INV-YYYYMMDD-XXXX.
 * XXXX là số thứ tự trong ngày, đệm 0 đủ 4 chữ số.
 * Phải chạy trong transaction Prisma để tránh race condition.
 *
 * @param {import('@prisma/client').Prisma.TransactionClient} tx
 * @returns {Promise<string>} Ví dụ: "INV-20240321-0001"
 */
const generateInvoiceNumber = async (tx) => {
  const now = new Date();
  const dayStart = startOfDay(now);
  const dayEnd = endOfDay(now);

  const countToday = await tx.invoice.count({
    where: {
      createdAt: {
        gte: dayStart,
        lte: dayEnd,
      },
    },
  });

  const sequence = String(countToday + 1).padStart(4, '0');
  const datePart = format(now, 'yyyyMMdd');

  return `INV-${datePart}-${sequence}`;
};

module.exports = { generateInvoiceNumber };
