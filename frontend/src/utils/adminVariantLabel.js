/**
 * Nhãn hiển thị biến thể trong admin: SKU + thuộc tính (màu, dung lượng, ...).
 */
export function formatAdminVariantLabel(variant) {
  if (!variant) return '';
  const sku = variant.sku?.trim() || '';
  const parts = (variant.values || [])
    .map((row) => {
      const av = row.attributeValue;
      if (!av) return null;
      const attrName = av.attribute?.name || '';
      const val = av.value ?? av.name ?? '';
      if (attrName && val) return `${attrName}: ${val}`;
      return val || null;
    })
    .filter(Boolean);
  const detail = parts.join(' · ');
  if (sku && detail) return `${sku} — ${detail}`;
  if (detail) return detail;
  return sku || '';
}
