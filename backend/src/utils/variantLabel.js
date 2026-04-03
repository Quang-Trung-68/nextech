/**
 * Chuẩn hóa nhãn biến thể từ ProductVariant (đã include values → attributeValue → attribute).
 * @param {object|null} variant
 * @returns {{ options: { attributeName: string, value: string }[], summary: string }}
 */
function buildVariantDisplay(variant) {
  if (!variant?.values?.length) {
    return { options: [], summary: '' };
  }
  const rows = variant.values
    .map((vv) => {
      const av = vv.attributeValue;
      if (!av) return null;
      const attr = av.attribute;
      return {
        attributeName: attr?.name || 'Loại',
        value: av.value,
        attrPosition: attr?.position ?? 0,
      };
    })
    .filter(Boolean);
  rows.sort((a, b) => a.attrPosition - b.attrPosition);
  const options = rows.map(({ attributeName, value }) => ({ attributeName, value }));
  const summary = options.map((o) => `${o.attributeName}: ${o.value}`).join(' · ');
  return { options, summary };
}

module.exports = { buildVariantDisplay };
