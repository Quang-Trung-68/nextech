const prisma = require('../utils/prisma');
const { calculateVatBreakdown } = require('../utils/vatCalculator')
const { generateInvoiceNumber } = require('../utils/invoiceNumber')
const PdfService = require('./pdf.service')
const EmailService = require('./email.service')

/**
 * Include shape chuẩn để tính VAT
 */
const ORDER_INVOICE_INCLUDE = {
  orderItems: {
    include: { product: true },
  },
  user: true,
  invoice: { include: { items: true } },
}

async function getOrderForInvoice(orderId) {
  return prisma.order.findUniqueOrThrow({
    where: { id: orderId },
    include: ORDER_INVOICE_INCLUDE,
  })
}

/**
 * Lấy VAT rate từ ShopSettings, fallback 10% nếu chưa cấu hình
 */
async function getVatRate() {
  const settings = await prisma.shopSettings.findUnique({
    where: { id: 'singleton' },
  })
  return Number(settings?.vatRate ?? 0.10)
}

/**
 * Tạo Invoice DRAFT và lưu vào DB.
 *
 * Gọi khi:
 *   - Checkout: user request VAT (vatInvoiceRequested = true)
 *   - Admin: tạo thủ công cho bất kỳ order nào
 *
 * Idempotent: nếu invoice đã tồn tại thì trả về invoice cũ, không tạo mới.
 *
 * @param {string} orderId
 * @param {Object|null} overrideBuyerInfo - Admin có thể override thông tin buyer
 * @returns {Promise<Invoice>}
 */
async function createDraftInvoice(orderId, overrideBuyerInfo = null) {
  const [order, shopSettings, vatRate] = await Promise.all([
    getOrderForInvoice(orderId),
    prisma.shopSettings.findUnique({ where: { id: 'singleton' } }),
    getVatRate(),
  ])

  // Idempotent guard
  if (order.invoice) {
    return order.invoice
  }

  const breakdown      = calculateVatBreakdown(order, vatRate)
  const invoiceNumber  = await generateInvoiceNumber()
  const shippingAddr   = order.shippingAddress // Json field từ Order

  // Buyer info: override (admin) > VAT fields từ Order > fallback user/shipping
  const isIndividual = order.vatBuyerType === 'INDIVIDUAL' || !order.vatBuyerType
  const buyerName    = overrideBuyerInfo?.buyerName    ?? order.vatBuyerName    ?? shippingAddr?.fullName    ?? order.user.name
  const buyerEmail   = overrideBuyerInfo?.buyerEmail   ?? (order.vatBuyerType === 'COMPANY' ? order.vatBuyerEmail : null) ?? order.user.email
  const buyerPhone   = overrideBuyerInfo?.buyerPhone   ?? shippingAddr?.phone       ?? order.user.phone
  const buyerAddress = overrideBuyerInfo?.buyerAddress ?? (
    isIndividual
      ? (order.vatBuyerAddress ?? shippingAddr?.address ?? '')
      : (order.vatBuyerCompanyAddress ?? shippingAddr?.address ?? '')
  )
  const buyerCompany = overrideBuyerInfo?.buyerCompany ?? order.vatBuyerCompany     ?? null
  const buyerTaxCode = overrideBuyerInfo?.buyerTaxCode ?? order.vatBuyerTaxCode     ?? null

  return prisma.invoice.create({
    data: {
      invoiceNumber,
      orderId,
      status: 'DRAFT',

      // Snapshot buyer
      buyerName,
      buyerEmail,
      buyerPhone,
      buyerAddress,
      buyerCompany,
      buyerTaxCode,

      // Snapshot seller từ ShopSettings tại thời điểm tạo
      sellerName:    shopSettings?.shopName    ?? 'NexTech',
      sellerAddress: shopSettings?.shopAddress ?? '',
      sellerTaxCode: shopSettings?.taxCode     ?? '',

      // Tài chính — tất cả pre-tax
      subtotal:       breakdown.subtotal,
      discountAmount: breakdown.discountAmount,
      vatRate:        breakdown.vatRate,  // snapshot — quan trọng khi thuế suất thay đổi
      vatAmount:      breakdown.vatAmount,
      totalAmount:    breakdown.totalAmount,

      items: {
        create: breakdown.items.map((item) => ({
          productName: item.productName,
          sku:         item.sku,
          quantity:    item.quantity,
          unitPrice:   item.unitPrice,
          totalPrice:  item.totalPrice,
        })),
      },
    },
    include: { items: true },
  })
}

/**
 * Chuyển Invoice DRAFT → ISSUED, set issuedAt.
 * Gọi khi: Order chuyển sang DELIVERED.
 */
async function issueInvoice(invoiceId) {
  return prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      status:   'ISSUED',
      issuedAt: new Date(),
    },
    include: { items: true, order: { include: { user: true } } },
  })
}

/**
 * Lấy Invoice theo orderId (kèm items, để generate PDF hoặc admin xem)
 */
async function getInvoiceByOrderId(orderId) {
  return prisma.invoice.findUnique({
    where: { orderId },
    include: {
      items: true,
      order: { include: { user: true } },
    },
  })
}

/**
 * Lấy Invoice theo invoiceId (kèm items + order/user, để generate PDF hoặc admin xem)
 */
async function getInvoiceById(invoiceId) {
  return prisma.invoice.findUniqueOrThrow({
    where: { id: invoiceId },
    include: {
      items: true,
      order: { include: { user: true } },
    },
  })
}

/**
 * Gửi lại email hóa đơn kèm PDF cho buyer.
 * Cập nhật emailSentAt sau khi gửi thành công.
 */
async function resendInvoiceEmail(invoiceId) {
  const invoice = await getInvoiceById(invoiceId)
  const pdfBuffer = await PdfService.generateBuffer(invoice)
  await EmailService.sendInvoiceEmail(invoice.buyerEmail, invoice, pdfBuffer)
  return prisma.invoice.update({
    where: { id: invoiceId },
    data: { emailSentAt: new Date() },
  })
}

/**
 * Admin hủy invoice
 */
async function cancelInvoice(invoiceId) {
  return prisma.invoice.update({
    where: { id: invoiceId },
    data: { status: 'CANCELLED' },
  })
}

module.exports = {
  createDraftInvoice,
  issueInvoice,
  getInvoiceById,
  getInvoiceByOrderId,
  cancelInvoice,
  resendInvoiceEmail,
}
