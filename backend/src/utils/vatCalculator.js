/**
 * CONVENTION TÍNH VAT:
 *
 * Tất cả giá trong DB đều là giá ĐÃ BAO GỒM VAT (post-tax).
 * Khi xuất hóa đơn kế toán, tách ngược ra pre-tax theo công thức:
 *
 *   preTax = postTax / (1 + vatRate)
 *
 * Breakdown một đơn hàng:
 *   subtotal       = sum(items.unitPrice * qty)       — pre-tax, chưa trừ discount
 *   discountAmount = Order.discountAmount / (1 + r)   — discount cũng tách pre-tax
 *   vatBase        = subtotal - discountAmount         — base để tính VAT
 *   vatAmount      = round(vatBase * vatRate)
 *   totalAmount    = vatBase + vatAmount               — phải khớp Order.totalAmount (±1 VND làm tròn)
 */

/**
 * Tách pre-tax từ giá đã có VAT, làm tròn VND
 * @param {number} priceWithVat
 * @param {number} vatRate - vd: 0.10
 * @returns {number}
 */
function extractPreTax(priceWithVat, vatRate) {
  return Math.round(priceWithVat / (1 + vatRate))
}

/**
 * Tính toán breakdown VAT đầy đủ cho một Order
 * @param {Object} order - Phải include orderItems.product
 * @param {number} vatRate - Lấy từ ShopSettings.vatRate
 * @returns {Object} breakdown
 */
function calculateVatBreakdown(order, vatRate) {
  // Pre-tax từng dòng sản phẩm
  const items = order.orderItems.map((item) => {
    const unitPrice = extractPreTax(Number(item.price), vatRate)
    const totalPrice = unitPrice * item.quantity
    return {
      productName: item.product.name,
      sku:         item.product.sku ?? null,
      quantity:    item.quantity,
      unitPrice,   // pre-tax
      totalPrice,  // pre-tax * qty
    }
  })

  const subtotal       = items.reduce((sum, i) => sum + i.totalPrice, 0)
  const discountAmount = Math.round(Number(order.discountAmount) / (1 + vatRate))
  const vatBase        = subtotal - discountAmount
  const vatAmount      = Math.round(vatBase * vatRate)
  const totalAmount    = vatBase + vatAmount

  // Kiểm tra toàn vẹn — cảnh báo nếu lệch quá 1 VND
  const expectedTotal = Math.round(Number(order.totalAmount))
  if (Math.abs(totalAmount - expectedTotal) > 1) {
    console.warn(
      `[VAT] Mismatch orderId=${order.id}: calculated=${totalAmount}, expected=${expectedTotal}`
    )
  }

  return {
    subtotal,
    discountAmount,
    vatRate,
    vatAmount,
    totalAmount: expectedTotal, // dùng giá gốc Order để tránh sai lệch tích lũy
    items,
  }
}

module.exports = { calculateVatBreakdown, extractPreTax }
