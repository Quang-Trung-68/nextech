/** Dòng tóm tắt tên + biến thể cho danh sách đơn hàng. */
export function orderItemSummaryLine(item) {
  const n = item.product?.name || 'Sản phẩm';
  return item.variantSummary ? `${n} (${item.variantSummary})` : n;
}
