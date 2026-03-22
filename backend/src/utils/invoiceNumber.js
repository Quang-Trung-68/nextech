const prisma = require('./prisma');

/**
 * Generate invoiceNumber dạng INV-YYYY-XXXXXX
 * Đếm số lượng invoice trong năm hiện tại để tạo số thứ tự.
 * Không dùng sequence DB để giữ đơn giản, chấp nhận gap nếu transaction rollback.
 */
async function generateInvoiceNumber() {
  const year = new Date().getFullYear()
  const count = await prisma.invoice.count({
    where: {
      invoiceNumber: { startsWith: `INV-${year}-` },
    },
  })
  const seq = String(count + 1).padStart(6, '0')
  return `INV-${year}-${seq}`
}

module.exports = { generateInvoiceNumber }
