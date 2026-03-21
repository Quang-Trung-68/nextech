const prisma = require('../utils/prisma');
const { generateInvoiceNumber } = require('../utils/invoiceNumber');
const { AppError, NotFoundError } = require('../errors/AppError');

// ─── Helpers ──────────────────────────────────────────────────────────────────

const INVOICE_INCLUDE = {
  items: true,
};

/**
 * Chuyển đổi shippingAddress (JSON) thành chuỗi địa chỉ đọc được.
 * @param {object|string} addr
 * @returns {string}
 */
const _formatAddress = (addr) => {
  if (!addr) return '';
  if (typeof addr === 'string') return addr;
  return [addr.address || addr.addressLine, addr.ward, addr.city]
    .filter(Boolean)
    .join(', ');
};

// ─── Service ──────────────────────────────────────────────────────────────────

const InvoiceService = {
  /**
   * Tạo Invoice DRAFT ngay khi Order được tạo.
   * PHẢI chạy trong transaction (tx) được truyền từ ngoài vào.
   * Tuyệt đối không gọi prisma.xxx trực tiếp bên trong hàm này.
   *
   * @param {string} orderId
   * @param {import('@prisma/client').Prisma.TransactionClient} tx
   * @returns {Promise<import('@prisma/client').Invoice>}
   */
  async createDraftForOrder(orderId, tx) {
    // Fetch Order (include orderItems → product, user, shippingAddress)
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: {
        orderItems: {
          include: {
            product: { select: { id: true, name: true } },
          },
        },
        user: {
          select: { id: true, name: true, email: true, phone: true },
        },
      },
    });

    if (!order) throw new NotFoundError('Order');

    // Fetch ShopSettings (singleton)
    const shop = await tx.shopSettings.findUnique({ where: { id: 'singleton' } });
    if (!shop) throw new AppError('ShopSettings chưa được cấu hình', 500, 'SHOP_SETTINGS_MISSING');

    // ── Tính toán tài chính ──────────────────────────────────────────────────
    const VAT_RATE = 0.10;

    const subtotal = order.orderItems.reduce((sum, item) => {
      return sum + Number(item.price) * item.quantity;
    }, 0);

    const discountAmount = Number(order.discountAmount || 0);
    const vatAmount = Math.round(subtotal * VAT_RATE);
    const totalAmount = subtotal - discountAmount + vatAmount;

    // ── Sinh số hóa đơn (trong cùng transaction) ─────────────────────────────
    const invoiceNumber = await generateInvoiceNumber(tx);

    // ── Snapshot buyer info ──────────────────────────────────────────────────
    const addr = order.shippingAddress || {};
    const buyerName = (typeof addr === 'object' && addr.fullName) || order.user?.name || '';
    const buyerPhone = (typeof addr === 'object' && addr.phone) || order.user?.phone || null;
    const buyerAddress = _formatAddress(addr);

    // ── Tạo Invoice + InvoiceItems trong transaction ─────────────────────────
    const invoice = await tx.invoice.create({
      data: {
        invoiceNumber,
        orderId,
        status: 'DRAFT',

        // Buyer snapshot
        buyerName,
        buyerEmail: order.user?.email || '',
        buyerPhone,
        buyerAddress,
        buyerCompany: null,
        buyerTaxCode: null,

        // Seller snapshot
        sellerName: shop.shopName,
        sellerAddress: shop.shopAddress,
        sellerTaxCode: shop.taxCode,

        // Tài chính
        subtotal: Math.round(subtotal),
        discountAmount: Math.round(discountAmount),
        vatRate: VAT_RATE,
        vatAmount,
        totalAmount: Math.round(totalAmount),

        items: {
          create: order.orderItems.map((item) => ({
            productName: item.product?.name || 'Sản phẩm',
            sku: item.product?.sku || null,
            quantity: item.quantity,
            unitPrice: Math.round(Number(item.price)),
            totalPrice: Math.round(Number(item.price) * item.quantity),
          })),
        },
      },
      include: INVOICE_INCLUDE,
    });

    return invoice;
  },

  /**
   * Cập nhật Invoice: status → ISSUED, issuedAt → now().
   *
   * @param {string} invoiceId
   * @returns {Promise<import('@prisma/client').Invoice>}
   */
  async issueInvoice(invoiceId) {
    const invoice = await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: 'ISSUED',
        issuedAt: new Date(),
      },
      include: INVOICE_INCLUDE,
    });
    return invoice;
  },

  /**
   * Fetch Invoice đầy đủ (include items).
   * Throw NotFoundError 404 nếu không tồn tại.
   *
   * @param {string} invoiceId
   * @returns {Promise<import('@prisma/client').Invoice>}
   */
  async getInvoiceById(invoiceId) {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: INVOICE_INCLUDE,
    });
    if (!invoice) throw new NotFoundError('Invoice');
    return invoice;
  },

  /**
   * Gửi lại email hóa đơn đã phát hành cho buyer.
   *
   * @param {string} invoiceId
   * @returns {Promise<void>}
   */
  async resendInvoiceEmail(invoiceId) {
    const invoice = await this.getInvoiceById(invoiceId);

    if (invoice.status !== 'ISSUED') {
      throw new AppError('Chỉ có thể gửi lại hóa đơn đã phát hành', 400, 'INVOICE_NOT_ISSUED');
    }

    // Lazy require để tránh circular dependency
    const PdfService = require('./pdf.service');
    const EmailService = require('./email.service');

    const pdfBuffer = await PdfService.generateBuffer(invoice);
    await EmailService.sendInvoiceEmail(invoice.buyerEmail, invoice, pdfBuffer);

    await prisma.invoice.update({
      where: { id: invoiceId },
      data: { emailSentAt: new Date() },
    });
  },
};

module.exports = InvoiceService;
